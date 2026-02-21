package com.booking.repository;

import com.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByTrainId(Long trainId);
    List<Booking> findByTrainIdAndStatusIgnoreCase(Long trainId, String status);
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Booking> findByIdAndStatus(Long id, String status);

    @Query(value = """
            SELECT COALESCE(MAX(daily_booked), 0)
            FROM (
                SELECT COALESCE(SUM(seats_booked), 0) AS daily_booked
                FROM bookings
                WHERE train_id = :trainId
                  AND UPPER(status) = 'BOOKED'
                GROUP BY travel_date
            ) AS booked_per_day
            """, nativeQuery = true)
    Integer findMaxSeatsBookedForAnyTravelDate(@Param("trainId") Long trainId);
}
