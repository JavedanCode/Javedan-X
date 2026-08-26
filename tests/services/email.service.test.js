import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock('resend', () => ({
  Resend: vi.fn(
    class MockResend {
      constructor() {
        this.emails = {
          send: sendMock,
        };
      }
    },
  ),
}));

import { env } from '../../src/config/env.js';
import { sendEmail } from '../../src/services/email.service.js';

describe('email service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skipIf(!env.EMAIL_ENABLED)('sends an email through Resend', async () => {
    sendMock.mockResolvedValue({
      data: {
        id: 'email-123',
      },
      error: null,
    });

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test email',
      html: '<p>Hello!</p>',
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: expect.any(String),
      to: 'user@example.com',
      subject: 'Test email',
      html: '<p>Hello!</p>',
    });

    expect(result).toEqual({
      id: 'email-123',
    });
  });

  it.skipIf(!env.EMAIL_ENABLED)('throws an AppError when Resend returns an error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: {
        message: 'Invalid API key',
      },
    });

    const promise = sendEmail({
      to: 'user@example.com',
      subject: 'Test email',
      html: '<p>Hello!</p>',
    });

    await expect(promise).rejects.toMatchObject({
      statusCode: 503,
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'Unable to deliver the email. Please try again later.',
    });
  });

  it.skipIf(env.EMAIL_ENABLED)('throws when email functionality is disabled', async () => {
    await expect(
      sendEmail({
        to: 'user@example.com',
        subject: 'Test email',
        html: '<p>Hello!</p>',
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: 'EMAIL_FEATURE_DISABLED',
      message: 'Email functionality is disabled.',
    });

    expect(sendMock).not.toHaveBeenCalled();
  });
});
