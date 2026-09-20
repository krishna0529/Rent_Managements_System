package com.Rent_Management.service;

import com.Rent_Management.dto.DashboardAnalyticsResponse;

public interface AdminDashboardService {

    DashboardAnalyticsResponse getDashboardAnalytics();

    DashboardAnalyticsResponse getDashboardAnalytics(String period);

    byte[] exportPaymentsCsv(String period);
}
