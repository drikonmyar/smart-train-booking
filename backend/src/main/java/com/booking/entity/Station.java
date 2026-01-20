package com.booking.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "stations")
@Data
public class Station extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

//    @Column
//    private String city;

}
