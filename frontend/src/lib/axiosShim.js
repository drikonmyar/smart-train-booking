function buildUrl(baseURL = '', path = '', params) {
    const combinedPath = `${baseURL || ''}${path || ''}`;
    const parsedUrl = new URL(combinedPath, window.location.origin);

    if (params && typeof params === 'object') {
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            parsedUrl.searchParams.append(key, String(value));
        });
    }

    if (parsedUrl.origin === window.location.origin) {
        return `${parsedUrl.pathname}${parsedUrl.search}`;
    }

    return parsedUrl.toString();
}

async function parseResponseBody(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    try {
        return await response.text();
    } catch {
        return null;
    }
}

function createClient(defaultConfig = {}) {
    const baseURL = defaultConfig.baseURL || '';
    const defaultHeaders = defaultConfig.headers || {};

    async function request(method, url, data, config = {}) {
        const headers = {
            ...defaultHeaders,
            ...(config.headers || {})
        };

        const targetUrl = buildUrl(baseURL, url, config.params);
        const fetchConfig = {
            method,
            headers
        };

        if (data !== undefined && data !== null) {
            if (!fetchConfig.headers['Content-Type']) {
                fetchConfig.headers['Content-Type'] = 'application/json';
            }
            fetchConfig.body = typeof data === 'string' ? data : JSON.stringify(data);
        }

        const response = await fetch(targetUrl, fetchConfig);
        const body = await parseResponseBody(response);

        if (!response.ok) {
            const error = new Error((body && body.message) || `HTTP ${response.status}`);
            error.response = {
                status: response.status,
                data: body
            };
            throw error;
        }

        return {
            status: response.status,
            data: body,
            headers: response.headers
        };
    }

    return {
        get: (url, config) => request('GET', url, null, config),
        post: (url, data, config) => request('POST', url, data, config),
        put: (url, data, config) => request('PUT', url, data, config),
        patch: (url, data, config) => request('PATCH', url, data, config),
        delete: (url, config) => request('DELETE', url, null, config)
    };
}

const axios = {
    create: (config) => createClient(config),
    ...createClient()
};

export default axios;
