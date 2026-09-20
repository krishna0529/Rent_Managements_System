package com.Rent_Management.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:krishnasingh9697@gmail.com}")
    private String fromEmail;

    /**
     * Send 6-digit OTP email from krishnasingh9697@gmail.com to target admin email.
     */
    public void sendAdminEmailOtp(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Admin Security");
            helper.setTo(toEmail);
            helper.setSubject("Singh Rent House: Admin Security Verification Code");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b1326; color: #dae2fd; padding: 32px 20px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid rgba(76, 215, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.6);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4cd7f6; margin: 0; font-size: 24px; letter-spacing: -0.5px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;\">Sovereign Admin Security Node</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; text-align: center;\">"
                    + "<p style=\"font-size: 14px; color: #c7c4d8; margin-top: 0;\">You requested to update the administrative recovery email for your account.</p>"
                    + "<p style=\"font-size: 13px; color: #918fa1;\">Use the following 6-digit verification challenge code:</p>"
                    + "<div style=\"margin: 24px auto; padding: 14px 28px; background-color: #060e20; border: 2px dashed #4cd7f6; display: inline-block; border-radius: 8px;\">"
                    + "<span style=\"font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #67f4b7;\">" + otpCode + "</span>"
                    + "</div>"
                    + "<p style=\"color: #ffb4ab; font-size: 12px; margin-bottom: 0;\">&#9888; This verification code expires in <strong>10 minutes</strong>.</p>"
                    + "</div>"
                    + "<div style=\"margin-top: 24px; font-size: 12px; color: #918fa1; line-height: 1.6;\">"
                    + "<p style=\"margin: 0;\"><strong>Sender:</strong> " + fromEmail + "</p>"
                    + "<p style=\"margin: 0;\"><strong>Target Recipient:</strong> " + toEmail + "</p>"
                    + "<p style=\"margin-top: 12px; font-size: 11px; color: #5a5969;\">If you did not request this email change from the Admin Security Settings panel, please secure your administrative master credentials immediately.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("[EMAIL DISPATCH] Successfully delivered OTP email from '{}' to '{}'", fromEmail, toEmail);
        } catch (MessagingException | RuntimeException e) {
            log.error("[EMAIL DISPATCH FAILED] Could not send OTP email to '{}': {}. (Ensure 16-digit Google App Password is set in application.properties)", toEmail, e.getMessage());
            // We do not rethrow so user can still see fallback OTP in console during development setup
        } catch (Exception e) {
            log.error("[EMAIL DISPATCH FAILED] Unexpected error sending email: {}", e.getMessage());
        }
    }

    /**
     * Send 6-digit OTP email for member password reset recovery.
     */
    public void sendPasswordResetOtp(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Security Recovery");
            helper.setTo(toEmail);
            helper.setSubject("Singh Rent House: Password Reset Verification Code");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b1326; color: #dae2fd; padding: 32px 20px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid rgba(76, 215, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.6);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4cd7f6; margin: 0; font-size: 24px; letter-spacing: -0.5px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px;\">Member Account Password Recovery Node</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; text-align: center;\">"
                    + "<p style=\"font-size: 14px; color: #c7c4d8; margin-top: 0;\">You requested to reset the password for your member account.</p>"
                    + "<p style=\"font-size: 13px; color: #918fa1;\">Use the following 6-digit verification security code:</p>"
                    + "<div style=\"margin: 24px auto; padding: 14px 28px; background-color: #060e20; border: 2px dashed #4cd7f6; display: inline-block; border-radius: 8px;\">"
                    + "<span style=\"font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #67f4b7;\">" + otpCode + "</span>"
                    + "</div>"
                    + "<p style=\"color: #ffb4ab; font-size: 12px; margin-bottom: 0;\">&#9888; This verification code expires in <strong>10 minutes</strong>.</p>"
                    + "</div>"
                    + "<div style=\"margin-top: 24px; font-size: 12px; color: #918fa1; line-height: 1.6;\">"
                    + "<p style=\"margin: 0;\"><strong>Target Recipient:</strong> " + toEmail + "</p>"
                    + "<p style=\"margin-top: 12px; font-size: 11px; color: #5a5969;\">If you did not request this password reset, please ignore this email or contact support immediately.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[EMAIL DISPATCH] Successfully delivered Password Reset OTP email to '{}'", toEmail);
        } catch (MessagingException | RuntimeException e) {
            log.error("[EMAIL DISPATCH FAILED] Could not send Password Reset OTP to '{}': {}. (Fallback OTP available in console)", toEmail, e.getMessage());
        } catch (Exception e) {
            log.error("[EMAIL DISPATCH FAILED] Unexpected error sending password reset email: {}", e.getMessage());
        }
    }

    /**
     * Send instant notification to admin inbox when a tenant submits a contact dispatch.
     */
    public void sendContactDispatchEmail(String senderName, String senderEmail, String category, String messageBody, String roomUnit, String mobile) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Tenant Dispatch");
            helper.setTo(fromEmail); // Admin inbox
            helper.setSubject("🚨 Tenant Dispatch Alert [" + (category != null ? category : "General Query") + "] - " + (roomUnit != null ? roomUnit : "Unit 402"));

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b1326; color: #dae2fd; padding: 32px 20px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid rgba(76, 215, 246, 0.25); box-shadow: 0 20px 40px rgba(0,0,0,0.6);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4cd7f6; margin: 0; font-size: 22px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Incoming Tenant Dispatch Pipeline</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 20px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 16px;\">"
                    + "<p style=\"font-size: 13px; color: #67f4b7; margin-top: 0; font-weight: bold;\">Sender Information:</p>"
                    + "<p style=\"font-size: 13px; margin: 4px 0;\"><strong>Name:</strong> " + senderName + "</p>"
                    + "<p style=\"font-size: 13px; margin: 4px 0;\"><strong>Email:</strong> " + senderEmail + "</p>"
                    + "<p style=\"font-size: 13px; margin: 4px 0;\"><strong>Unit / Mobile:</strong> " + (roomUnit != null ? roomUnit : "Unit 402") + " • " + (mobile != null ? mobile : "N/A") + "</p>"
                    + "<p style=\"font-size: 13px; margin: 4px 0;\"><strong>Classification:</strong> <span style=\"color: #acedff;\">" + category + "</span></p>"
                    + "</div>"
                    + "<div style=\"background-color: #060e20; padding: 20px; border-radius: 8px; border: 1px solid rgba(76, 215, 246, 0.3);\">"
                    + "<p style=\"font-size: 12px; color: #918fa1; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;\">Message / Dispatch Payload:</p>"
                    + "<p style=\"font-size: 14px; color: #dae2fd; line-height: 1.6; white-space: pre-wrap;\">" + messageBody + "</p>"
                    + "</div>"
                    + "<div style=\"margin-top: 20px; font-size: 11px; color: #5a5969; text-align: center;\">"
                    + "<p>This is an automated priority dispatch from the Singh Rent House Tenant Zero-Trust Portal.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[CONTACT DISPATCH] Successfully forwarded tenant query from '{}' to admin '{}'", senderEmail, fromEmail);
        } catch (MessagingException | RuntimeException e) {
            log.error("[CONTACT DISPATCH FAILED] Could not forward email to admin: {}. (Payload logged in console)", e.getMessage());
        } catch (Exception e) {
            log.error("[CONTACT DISPATCH FAILED] Unexpected error: {}", e.getMessage());
        }
    }

    /**
     * Sends official Approval & Digital Passkey Dispatch to newly approved tenant
     */
    public void sendTenantApprovalNotification(String recipientEmail, String tenantName, String roomUnit) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("🎉 Congratulations! Your Tenant Application is Approved - " + (roomUnit != null ? roomUnit : "Singh Luxury Heights"));

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b1326; color: #dae2fd; border-radius: 12px; border: 1px solid rgba(78, 222, 163, 0.4);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4edea3; margin: 0; font-size: 24px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Zero-Trust Residential Suite Authorization</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 16px;\">"
                    + "<h3 style=\"color: #67f4b7; margin-top: 0;\">Dear " + tenantName + ",</h3>"
                    + "<p style=\"font-size: 14px; line-height: 1.6;\">Your tenant onboarding filing and KYC Aadhaar verification have been <strong>officially approved</strong> by Singh Rent House administration.</p>"
                    + "<div style=\"background-color: #060e20; padding: 16px; border-radius: 6px; border-left: 4px solid #4edea3; margin: 16px 0;\">"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Allocated Unit:</strong> <span style=\"color: #4cd7f6;\">" + (roomUnit != null ? roomUnit : "ROOM-304") + "</span></p>"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Account Status:</strong> <span style=\"color: #4edea3; font-weight: bold;\">ACTIVE & VERIFIED</span></p>"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Smart Lock Passkey:</strong> Dispatched & Provisioned</p>"
                    + "</div>"
                    + "<p style=\"font-size: 14px; line-height: 1.6;\">You may now log in to the Tenant Portal to view your rent ledger, submit electricity sub-meter readings, and access residential facilities.</p>"
                    + "<div style=\"text-align: center; margin: 24px 0 12px 0;\">"
                    + "<a href=\"http://localhost:3000/login\" style=\"background: linear-gradient(135deg, #4f46e5, #03b5d3); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;\">Open Resident Portal</a>"
                    + "</div>"
                    + "</div>"
                    + "<div style=\"margin-top: 20px; font-size: 11px; color: #5a5969; text-align: center;\">"
                    + "<p>© 2025 Singh Rent House Enterprise Management. Koramangala, Bengaluru.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[APPROVAL EMAIL] Successfully notified tenant '{}' at '{}'", tenantName, recipientEmail);
        } catch (Exception e) {
            log.error("[APPROVAL EMAIL FAILED] Could not send approval email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    /**
     * Sends formal rejection notification to tenant applicant
     */
    public void sendTenantRejectionNotification(String recipientEmail, String tenantName, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Application Status Update - Singh Rent House");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b1326; color: #dae2fd; border-radius: 12px; border: 1px solid rgba(255, 180, 171, 0.3);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #ffb4ab; margin: 0; font-size: 22px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Application Review Notice</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 16px;\">"
                    + "<h3 style=\"color: #ffdad6; margin-top: 0;\">Dear " + tenantName + ",</h3>"
                    + "<p style=\"font-size: 14px; line-height: 1.6;\">Thank you for your interest in leasing at Singh Luxury Heights. After careful review of your onboarding documentation, your application has not been approved at this time.</p>"
                    + "<div style=\"background-color: #060e20; padding: 16px; border-radius: 6px; border-left: 4px solid #ffb4ab; margin: 16px 0;\">"
                    + "<p style=\"margin: 0; font-size: 13px; color: #ffb4ab;\"><strong>Review Rationale:</strong> " + (reason != null && !reason.isBlank() ? reason : "Incomplete or unverified documentation.") + "</p>"
                    + "</div>"
                    + "<p style=\"font-size: 13px; color: #918fa1;\">If you believe this decision was made in error or wish to furnish additional evidentiary documents, please reach out to property administration.</p>"
                    + "</div>"
                    + "<div style=\"margin-top: 20px; font-size: 11px; color: #5a5969; text-align: center;\">"
                    + "<p>© 2025 Singh Rent House Enterprise Management.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[REJECTION EMAIL] Successfully sent notice to '{}' at '{}'", tenantName, recipientEmail);
        } catch (Exception e) {
            log.error("[REJECTION EMAIL FAILED] Could not send notice to {}: {}", recipientEmail, e.getMessage());
        }
    }

    /**
     * Sends automated Rent Due notification email to tenant (30 days from joining / next cycle due date).
     */
    public void sendRentDueReminderNotification(String recipientEmail, String tenantName, String roomUnit, Double rentAmount, LocalDate dueDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Billing Notification");
            helper.setTo(recipientEmail);

            String formattedDate = dueDate != null
                    ? dueDate.format(DateTimeFormatter.ofPattern("dd MMMM, yyyy"))
                    : "Due Date";
            double amount = rentAmount != null ? rentAmount : 0.0;

            helper.setSubject("⏰ Rent Payment Due Notice: Unit " + (roomUnit != null ? roomUnit : "Suite") + " - Singh Rent House");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b1326; color: #dae2fd; border-radius: 12px; border: 1px solid rgba(76, 215, 246, 0.35); box-shadow: 0 20px 40px rgba(0,0,0,0.6);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4cd7f6; margin: 0; font-size: 24px; letter-spacing: -0.5px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Monthly Rent & Utility Billing Ledger</p>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 16px;\">"
                    + "<h3 style=\"color: #67f4b7; margin-top: 0; font-size: 18px;\">Hello " + tenantName + ",</h3>"
                    + "<p style=\"font-size: 14px; line-height: 1.6; color: #c7c4d8;\">This is a reminder that your 30-day monthly rental cycle payment for your residential suite is now due.</p>"
                    + "<div style=\"background-color: #060e20; padding: 20px; border-radius: 8px; border-left: 4px solid #4cd7f6; margin: 20px 0;\">"
                    + "<table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Allocated Suite:</td><td style=\"color: #ffffff; font-weight: bold; text-align: right;\">" + (roomUnit != null ? roomUnit : "Assigned Room") + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Due Date:</td><td style=\"color: #4edea3; font-weight: bold; text-align: right;\">" + formattedDate + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Monthly Base Rent:</td><td style=\"color: #4cd7f6; font-size: 18px; font-weight: bold; text-align: right;\">₹" + String.format("%,.2f", amount) + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Payment Status:</td><td style=\"color: #ffb4ab; font-weight: bold; text-align: right;\">PAYMENT DUE</td></tr>"
                    + "</table>"
                    + "</div>"
                    + "<p style=\"font-size: 13px; color: #918fa1; line-height: 1.5;\">Please ensure timely settlement of your monthly rent to maintain active passkey credentials and uninterrupted facility services.</p>"
                    + "<div style=\"text-align: center; margin: 26px 0 12px 0;\">"
                    + "<a href=\"http://localhost:3000/dashboard\" style=\"background: linear-gradient(135deg, #4f46e5, #03b5d3); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(79,70,229,0.4);\">Pay Rent via Resident Portal</a>"
                    + "</div>"
                    + "</div>"
                    + "<div style=\"background-color: #171f33; padding: 16px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.15); font-size: 12px; color: #918fa1;\">"
                    + "<p style=\"margin: 0 0 4px 0;\"><strong>Payment Mode Options:</strong> Instant UPI, Net Banking, or Cash Handover at Property Office.</p>"
                    + "<p style=\"margin: 0;\">Once paid, your Next Due Date will advance automatically by 30 days in the database.</p>"
                    + "</div>"
                    + "<div style=\"margin-top: 20px; font-size: 11px; color: #5a5969; text-align: center;\">"
                    + "<p>© 2025-2026 Singh Rent House Enterprise Management. Koramangala, Bengaluru.</p>"
                    + "<p>This is an automated dispatch from the Zero-Trust Billing Pipeline.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[RENT DUE EMAIL] Successfully sent 30-day rent due notification to '{}' at '{}' for unit '{}'", tenantName, recipientEmail, roomUnit);
        } catch (Exception e) {
            log.error("[RENT DUE EMAIL FAILED] Could not send rent due email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    /**
     * Sends dark luxury HTML Payment Receipt email to tenant upon successful Razorpay settlement.
     */
    public void sendPaymentSuccessReceiptEmail(
            String recipientEmail,
            String tenantName,
            String roomUnit,
            Double rentAmount,
            Double electricityAmount,
            Double totalPaid,
            String paymentId,
            String invoiceNumber,
            LocalDate nextDueDate,
            LocalDateTime paymentDate
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Payment Billing");
            helper.setTo(recipientEmail);

            String formattedDate = paymentDate != null
                    ? paymentDate.format(DateTimeFormatter.ofPattern("dd MMMM, yyyy - hh:mm a"))
                    : LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd MMMM, yyyy - hh:mm a"));

            String formattedNextDue = nextDueDate != null
                    ? nextDueDate.format(DateTimeFormatter.ofPattern("dd MMMM, yyyy"))
                    : "Next 30-Day Cycle";

            double rent = rentAmount != null ? rentAmount : 0.0;
            double electricity = electricityAmount != null ? electricityAmount : 0.0;
            double total = totalPaid != null ? totalPaid : (rent + electricity);

            helper.setSubject("💳 Payment Receipt Confirmed: ₹" + String.format("%,.2f", total) + " [Unit " + (roomUnit != null ? roomUnit : "Suite") + "] - Singh Rent House");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #0b1326; color: #dae2fd; border-radius: 12px; border: 1px solid rgba(78, 222, 163, 0.45); box-shadow: 0 20px 50px rgba(0,0,0,0.7);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #4edea3; margin: 0; font-size: 24px; letter-spacing: -0.5px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Official Digital Rent & Utility Settlement Receipt</p>"
                    + "</div>"

                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 20px;\">"
                    + "<div style=\"display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px; margin-bottom: 16px;\">"
                    + "<div>"
                    + "<span style=\"background-color: rgba(78, 222, 163, 0.15); color: #4edea3; font-weight: bold; padding: 4px 12px; border-radius: 4px; font-size: 12px; border: 1px solid rgba(78, 222, 163, 0.4);\">✓ PAYMENT VERIFIED & SETTLED</span>"
                    + "</div>"
                    + "<div style=\"text-align: right; color: #918fa1; font-size: 12px;\">"
                    + "<span>" + formattedDate + "</span>"
                    + "</div>"
                    + "</div>"

                    + "<h3 style=\"color: #ffffff; margin-top: 0; font-size: 18px;\">Payment Confirmation for " + tenantName + "</h3>"
                    + "<p style=\"font-size: 13px; color: #c7c4d8; line-height: 1.5;\">Thank you! Your online payment via <strong>Razorpay Payment Gateway</strong> has been authenticated and successfully recorded in the residential ledger.</p>"

                    + "<div style=\"background-color: #060e20; padding: 18px; border-radius: 8px; border: 1px solid rgba(76, 215, 246, 0.25); margin: 18px 0;\">"
                    + "<table style=\"width: 100%; border-collapse: collapse; font-size: 13px;\">"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Invoice Number:</td><td style=\"color: #ffffff; font-weight: bold; text-align: right; font-family: monospace;\">" + (invoiceNumber != null ? invoiceNumber : "INV-ONLINE") + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Razorpay Payment ID:</td><td style=\"color: #4cd7f6; font-weight: bold; text-align: right; font-family: monospace;\">" + (paymentId != null ? paymentId : "N/A") + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 6px 0;\">Allocated Suite:</td><td style=\"color: #ffffff; font-weight: bold; text-align: right;\">" + (roomUnit != null ? roomUnit : "Assigned Room") + "</td></tr>"
                    + "<tr style=\"border-top: 1px solid rgba(255,255,255,0.08);\"><td style=\"color: #918fa1; padding: 8px 0 4px 0;\">Room Rent Base:</td><td style=\"color: #ffffff; text-align: right; padding-top: 8px;\">₹" + String.format("%,.2f", rent) + "</td></tr>"
                    + "<tr><td style=\"color: #918fa1; padding: 4px 0;\">Electricity Sub-Meter:</td><td style=\"color: #ffffff; text-align: right;\">₹" + String.format("%,.2f", electricity) + "</td></tr>"
                    + "<tr style=\"border-top: 1px solid rgba(78, 222, 163, 0.3);\"><td style=\"color: #4edea3; font-weight: bold; font-size: 15px; padding: 10px 0 4px 0;\">Total Settled:</td><td style=\"color: #4edea3; font-weight: bold; font-size: 18px; text-align: right; padding-top: 10px;\">₹" + String.format("%,.2f", total) + "</td></tr>"
                    + "</table>"
                    + "</div>"

                    + "<div style=\"background-color: rgba(79, 70, 229, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); padding: 14px 18px; border-radius: 8px; margin: 16px 0;\">"
                    + "<p style=\"margin: 0; font-size: 13px; color: #dae2fd;\">🗓️ <strong>Next Cycle Due Date:</strong> <span style=\"color: #67f4b7; font-weight: bold;\">" + formattedNextDue + "</span> (Cycle extended by 30 days)</p>"
                    + "</div>"

                    + "<div style=\"text-align: center; margin: 24px 0 10px 0;\">"
                    + "<a href=\"http://localhost:3000/dashboard\" style=\"background: linear-gradient(135deg, #4f46e5, #03b5d3); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; box-shadow: 0 4px 12px rgba(79,70,229,0.4);\">View & Download Receipt in Portal</a>"
                    + "</div>"
                    + "</div>"

                    + "<div style=\"text-align: center; font-size: 11px; color: #5a5969; margin-top: 20px;\">"
                    + "<p>© 2025-2026 Singh Rent House Enterprise Management. Koramangala, Bengaluru.</p>"
                    + "<p>This is a computer-generated tax invoice & rent receipt. No physical signature required.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[PAYMENT SUCCESS EMAIL] Successfully sent receipt to '{}' at '{}' for ₹{}", tenantName, recipientEmail, total);
        } catch (Exception e) {
            log.error("[PAYMENT SUCCESS EMAIL FAILED] Could not send receipt email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    /**
     * Sends Payment Failure alert email to tenant when Razorpay transaction fails or is rejected.
     */
    public void sendPaymentFailureNotificationEmail(
            String recipientEmail,
            String tenantName,
            String roomUnit,
            Double amount,
            String orderId,
            String failureReason
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Singh Rent House - Payment Alerts");
            helper.setTo(recipientEmail);

            double attemptedAmount = amount != null ? amount : 0.0;
            helper.setSubject("⚠️ Payment Failed / Declined: Unit " + (roomUnit != null ? roomUnit : "Suite") + " - Singh Rent House");

            String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; background-color: #0b1326; color: #dae2fd; border-radius: 12px; border: 1px solid rgba(255, 180, 171, 0.45); box-shadow: 0 20px 50px rgba(0,0,0,0.7);\">"
                    + "<div style=\"text-align: center; margin-bottom: 24px;\">"
                    + "<h2 style=\"color: #ffb4ab; margin: 0; font-size: 24px; letter-spacing: -0.5px;\">Singh Rent House Enterprise</h2>"
                    + "<p style=\"color: #918fa1; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px;\">Payment Gateway Transaction Alert</p>"
                    + "</div>"

                    + "<div style=\"background-color: #171f33; padding: 24px; border-radius: 8px; border: 1px solid #464555; margin-bottom: 20px;\">"
                    + "<div style=\"margin-bottom: 16px;\">"
                    + "<span style=\"background-color: rgba(255, 180, 171, 0.15); color: #ffb4ab; font-weight: bold; padding: 4px 12px; border-radius: 4px; font-size: 12px; border: 1px solid rgba(255, 180, 171, 0.4);\">✖ TRANSACTION INCOMPLETE / FAILED</span>"
                    + "</div>"

                    + "<h3 style=\"color: #ffffff; margin-top: 0; font-size: 18px;\">Dear " + tenantName + ",</h3>"
                    + "<p style=\"font-size: 14px; color: #c7c4d8; line-height: 1.6;\">Your recent online rent settlement attempt of <strong style=\"color: #ffb4ab;\">₹" + String.format("%,.2f", attemptedAmount) + "</strong> could not be completed by the payment network.</p>"

                    + "<div style=\"background-color: #060e20; padding: 18px; border-radius: 8px; border-left: 4px solid #ffb4ab; margin: 18px 0;\">"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Allocated Unit:</strong> <span style=\"color: #ffffff;\">" + (roomUnit != null ? roomUnit : "Assigned Suite") + "</span></p>"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Order Reference:</strong> <span style=\"font-family: monospace; color: #4cd7f6;\">" + (orderId != null ? orderId : "N/A") + "</span></p>"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Failure Reason:</strong> <span style=\"color: #ffdad6;\">" + (failureReason != null && !failureReason.isBlank() ? failureReason : "Bank declined or transaction cancelled by user.") + "</span></p>"
                    + "<p style=\"margin: 4px 0; font-size: 13px;\"><strong>Account Deduction:</strong> <span style=\"color: #67f4b7;\">If money was debited from your bank, Razorpay will auto-refund within 2-5 banking days.</span></p>"
                    + "</div>"

                    + "<p style=\"font-size: 13px; color: #918fa1; line-height: 1.5;\">No charges have been settled on your rent account. Please log in to retry your payment via UPI, Debit/Credit Card, or Net Banking.</p>"

                    + "<div style=\"text-align: center; margin: 26px 0 10px 0;\">"
                    + "<a href=\"http://localhost:3000/dashboard\" style=\"background: linear-gradient(135deg, #ef4444, #b91c1c); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);\">Retry Payment Now</a>"
                    + "</div>"
                    + "</div>"

                    + "<div style=\"text-align: center; font-size: 11px; color: #5a5969; margin-top: 20px;\">"
                    + "<p>© 2025-2026 Singh Rent House Enterprise Management. Koramangala, Bengaluru.</p>"
                    + "<p>If you need assistance, contact management at krishnasingh9697@gmail.com.</p>"
                    + "</div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("[PAYMENT FAILURE EMAIL] Successfully sent alert to '{}' at '{}' for order '{}'", tenantName, recipientEmail, orderId);
        } catch (Exception e) {
            log.error("[PAYMENT FAILURE EMAIL FAILED] Could not send failure alert to {}: {}", recipientEmail, e.getMessage());
        }
    }
}
