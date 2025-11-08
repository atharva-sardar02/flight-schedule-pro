/**
 * Email Service with AWS SES Integration
 * Sends transactional emails for flight notifications
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logInfo, logError } from '../../utils/logger';

export type EmailTemplate = 
  | 'WEATHER_ALERT'
  | 'OPTIONS_AVAILABLE'
  | 'DEADLINE_REMINDER'
  | 'CONFIRMATION'
  | 'ESCALATION';

interface EmailData {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.fromEmail = process.env.SES_FROM_EMAIL || 'noreply@flightschedulepro.com';
  }

  /**
   * Send an email using AWS SES
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [data.to],
        },
        Message: {
          Subject: {
            Data: data.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: data.htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: data.textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await this.sesClient.send(command);

      logInfo('Email sent successfully', {
        to: data.to,
        subject: data.subject,
      });

      return true;
    } catch (error: any) {
      logError('Failed to send email', error, {
        to: data.to,
        subject: data.subject,
      });
      return false;
    }
  }

  /**
   * Send weather alert email
   */
  async sendWeatherAlert(
    to: string,
    recipientName: string,
    flightDetails: {
      scheduledTime: Date;
      departureAirport: string;
      arrivalAirport: string;
      violations: string[];
      hoursUntilFlight: number;
    }
  ): Promise<boolean> {
    const subject = `⚠️ Weather Alert for Your Flight on ${flightDetails.scheduledTime.toLocaleDateString()}`;

    const violationsList = flightDetails.violations.map((v) => `<li>${v}</li>`).join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .alert-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            ul { margin: 10px 0; padding-left: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Weather Alert</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <div class="alert-box">
                <strong>Your scheduled flight is now AT RISK due to weather conditions.</strong>
              </div>

              <div class="info-box">
                <h3>Flight Details:</h3>
                <p><strong>Date & Time:</strong> ${flightDetails.scheduledTime.toLocaleString()}</p>
                <p><strong>Route:</strong> ${flightDetails.departureAirport} → ${flightDetails.arrivalAirport}</p>
                <p><strong>Time Until Flight:</strong> ${flightDetails.hoursUntilFlight} hours</p>
              </div>

              <h3>Weather Violations:</h3>
              <ul>
                ${violationsList}
              </ul>

              <p>We are monitoring the situation closely. If conditions do not improve, we will provide rescheduling options shortly.</p>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>Flight Schedule Pro - Intelligent Flight Scheduling System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Weather Alert for Your Flight

Hi ${recipientName},

Your scheduled flight is now AT RISK due to weather conditions.

Flight Details:
Date & Time: ${flightDetails.scheduledTime.toLocaleString()}
Route: ${flightDetails.departureAirport} → ${flightDetails.arrivalAirport}
Time Until Flight: ${flightDetails.hoursUntilFlight} hours

Weather Violations:
${flightDetails.violations.join('\n')}

We are monitoring the situation closely. If conditions do not improve, we will provide rescheduling options shortly.

View your dashboard: ${process.env.FRONTEND_URL}/dashboard

---
Flight Schedule Pro - Intelligent Flight Scheduling System
    `;

    return this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send options available email
   */
  async sendOptionsAvailable(
    to: string,
    recipientName: string,
    bookingDetails: {
      originalTime: Date;
      departureAirport: string;
      arrivalAirport: string;
      optionsCount: number;
      deadline: Date;
    }
  ): Promise<boolean> {
    const subject = `✈️ Rescheduling Options Available for Your Flight`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .success-box { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0; }
            .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .urgent { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✈️ Rescheduling Options Ready</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <div class="success-box">
                <strong>Our AI has generated ${bookingDetails.optionsCount} optimal rescheduling options for your flight!</strong>
              </div>

              <p><strong>Original Flight:</strong> ${bookingDetails.originalTime.toLocaleString()}</p>
              <p><strong>Route:</strong> ${bookingDetails.departureAirport} → ${bookingDetails.arrivalAirport}</p>

              <div class="warning-box">
                <p><strong class="urgent">Action Required:</strong></p>
                <p>Please rank your preferences by: <strong>${bookingDetails.deadline.toLocaleString()}</strong></p>
                <p>The final selection will use the instructor's highest-ranked available option.</p>
              </div>

              <a href="${process.env.FRONTEND_URL}/reschedule" class="button">Rank Your Preferences</a>
            </div>
            <div class="footer">
              <p>Flight Schedule Pro - Intelligent Flight Scheduling System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Rescheduling Options Ready

Hi ${recipientName},

Our AI has generated ${bookingDetails.optionsCount} optimal rescheduling options for your flight!

Original Flight: ${bookingDetails.originalTime.toLocaleString()}
Route: ${bookingDetails.departureAirport} → ${bookingDetails.arrivalAirport}

ACTION REQUIRED:
Please rank your preferences by: ${bookingDetails.deadline.toLocaleString()}

The final selection will use the instructor's highest-ranked available option.

Rank your preferences: ${process.env.FRONTEND_URL}/reschedule

---
Flight Schedule Pro - Intelligent Flight Scheduling System
    `;

    return this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send deadline reminder email
   */
  async sendDeadlineReminder(
    to: string,
    recipientName: string,
    deadline: Date,
    hoursRemaining: number
  ): Promise<boolean> {
    const subject = `⏰ Reminder: ${hoursRemaining}h to Submit Flight Preferences`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .warning-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .urgent { font-size: 18px; font-weight: bold; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Deadline Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <div class="warning-box">
                <p class="urgent">You have ${hoursRemaining} hours remaining to submit your flight rescheduling preferences!</p>
              </div>

              <p><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>

              <p>If preferences are not submitted by the deadline, the system will escalate to administration for manual handling.</p>

              <a href="${process.env.FRONTEND_URL}/reschedule" class="button">Submit Preferences Now</a>
            </div>
            <div class="footer">
              <p>Flight Schedule Pro - Intelligent Flight Scheduling System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Deadline Reminder

Hi ${recipientName},

You have ${hoursRemaining} hours remaining to submit your flight rescheduling preferences!

Deadline: ${deadline.toLocaleString()}

If preferences are not submitted by the deadline, the system will escalate to administration for manual handling.

Submit preferences: ${process.env.FRONTEND_URL}/reschedule

---
Flight Schedule Pro - Intelligent Flight Scheduling System
    `;

    return this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send confirmation email
   */
  async sendConfirmation(
    to: string,
    recipientName: string,
    flightDetails: {
      newScheduledTime: Date;
      departureAirport: string;
      arrivalAirport: string;
    }
  ): Promise<boolean> {
    const subject = `✅ Flight Rescheduled Successfully`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .success-box { background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Flight Confirmed</h1>
            </div>
            <div class="content">
              <p>Hi ${recipientName},</p>
              
              <div class="success-box">
                <strong>Your flight has been successfully rescheduled!</strong>
              </div>

              <h3>New Flight Details:</h3>
              <p><strong>Date & Time:</strong> ${flightDetails.newScheduledTime.toLocaleString()}</p>
              <p><strong>Route:</strong> ${flightDetails.departureAirport} → ${flightDetails.arrivalAirport}</p>

              <p>We'll continue monitoring weather conditions and notify you of any changes.</p>

              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>Flight Schedule Pro - Intelligent Flight Scheduling System</p>
              <p>This is an automated notification. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Flight Confirmed

Hi ${recipientName},

Your flight has been successfully rescheduled!

New Flight Details:
Date & Time: ${flightDetails.newScheduledTime.toLocaleString()}
Route: ${flightDetails.departureAirport} → ${flightDetails.arrivalAirport}

We'll continue monitoring weather conditions and notify you of any changes.

View dashboard: ${process.env.FRONTEND_URL}/dashboard

---
Flight Schedule Pro - Intelligent Flight Scheduling System
    `;

    return this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
    });
  }

  /**
   * Send escalation email (to admin)
   */
  async sendEscalation(
    to: string,
    bookingDetails: {
      bookingId: string;
      studentName: string;
      instructorName: string;
      scheduledTime: Date;
      departureAirport: string;
      arrivalAirport: string;
      reason: string;
    }
  ): Promise<boolean> {
    const subject = `🚨 Escalation Required: Booking ${bookingDetails.bookingId}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .alert-box { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Escalation Alert</h1>
            </div>
            <div class="content">
              <div class="alert-box">
                <strong>Manual intervention required for booking ${bookingDetails.bookingId}</strong>
              </div>

              <h3>Booking Details:</h3>
              <p><strong>Student:</strong> ${bookingDetails.studentName}</p>
              <p><strong>Instructor:</strong> ${bookingDetails.instructorName}</p>
              <p><strong>Scheduled Time:</strong> ${bookingDetails.scheduledTime.toLocaleString()}</p>
              <p><strong>Route:</strong> ${bookingDetails.departureAirport} → ${bookingDetails.arrivalAirport}</p>

              <h3>Reason for Escalation:</h3>
              <p>${bookingDetails.reason}</p>

              <a href="${process.env.FRONTEND_URL}/admin/bookings/${bookingDetails.bookingId}" class="button">Review Booking</a>
            </div>
            <div class="footer">
              <p>Flight Schedule Pro - Intelligent Flight Scheduling System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
Escalation Alert

Manual intervention required for booking ${bookingDetails.bookingId}

Booking Details:
Student: ${bookingDetails.studentName}
Instructor: ${bookingDetails.instructorName}
Scheduled Time: ${bookingDetails.scheduledTime.toLocaleString()}
Route: ${bookingDetails.departureAirport} → ${bookingDetails.arrivalAirport}

Reason for Escalation:
${bookingDetails.reason}

Review booking: ${process.env.FRONTEND_URL}/admin/bookings/${bookingDetails.bookingId}

---
Flight Schedule Pro - Intelligent Flight Scheduling System
    `;

    return this.sendEmail({
      to,
      subject,
      htmlBody,
      textBody,
    });
  }
}

