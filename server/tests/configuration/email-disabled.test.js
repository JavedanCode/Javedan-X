import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import app from '../../src/app.js';
import { prisma } from '../../src/db/prisma.js';

const { sendEmailMock } = vi.hoisted(() => ({
  sendEmailMock: vi.fn(),
}));

vi.mock('../../src/services/email.service.js', () => ({
  sendEmail: sendEmailMock,
}));

describe('Email functionality disabled', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const passwordHash = await bcrypt.hash('StrongPassword123!', 12);

    await prisma.user.create({
      data: {
        username: 'emaildisabled',
        email: 'emaildisabled@example.com',
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    await prisma.verificationToken.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
  });

  it('automatically verifies newly registered users', async () => {
    const response = await request(app).post('/auth/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Registration successful. Your email has been automatically verified.',
      user: {
        username: 'newuser',
        email: 'newuser@example.com',
        emailVerifiedAt: expect.any(String),
      },
    });

    const user = await prisma.user.findUnique({
      where: {
        email: 'newuser@example.com',
      },
    });

    expect(user).not.toBeNull();
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('does not send an email during registration', async () => {
    await request(app).post('/auth/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('does not create an email verification token during registration', async () => {
    await request(app).post('/auth/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
    });

    const user = await prisma.user.findUnique({
      where: {
        email: 'newuser@example.com',
      },
    });

    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
      },
    });

    expect(verificationToken).toBeNull();
  });

  it('allows a newly registered user to log in immediately', async () => {
    await request(app).post('/auth/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'newuser@example.com',
      password: 'StrongPassword123!',
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Login successful.',
    });
  });

  it('does not send an email when resending verification', async () => {
    const response = await request(app).post('/auth/email/resend').send({
      email: 'emaildisabled@example.com',
    });

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'If the email can be verified, a verification email will be sent.',
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects password reset requests', async () => {
    const response = await request(app).post('/auth/password/forgot').send({
      email: 'emaildisabled@example.com',
    });

    expect(response.status).toBe(503);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'EMAIL_FEATURE_DISABLED',
        message: 'Password reset is unavailable because email functionality is disabled.',
      },
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('rejects email change requests', async () => {
    const agent = request.agent(app);

    await agent.post('/auth/login').send({
      email: 'emaildisabled@example.com',
      password: 'StrongPassword123!',
    });

    const response = await agent.patch('/users/me/email').send({
      email: 'newemail@example.com',
    });

    expect(response.status).toBe(503);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'EMAIL_FEATURE_DISABLED',
        message: 'Email change is unavailable because email functionality is disabled.',
      },
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
