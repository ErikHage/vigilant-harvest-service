import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

import { ensureError, FeralError } from '../errors';
import { getLogger } from '../logging';

const logger = getLogger('jwt-index');

export interface JwtSignerOptions {
  signOptions?: SignOptions,
  verifyOptions?: VerifyOptions,
}

const defaultSignOptions: SignOptions = {
  expiresIn: '60m',
  algorithm: 'RS256',
  issuer: 'feral-auth',
};

const defaultVerifyOptions: VerifyOptions = {
  algorithms: [ 'RS256', ],
  issuer: 'feral-auth',
  ignoreExpiration: false,
};

export class JwtSigner {
  private readonly privateKeySupplier: () => string;
  private readonly publicCertSupplier: () => string;

  private readonly signOptions: SignOptions;
  private readonly verifyOptions: VerifyOptions;

  private privateKey: string;
  private publicCert: string;

  /**
   * @param privateKeySupplier
   * @param publicCertSupplier
   * @param options
   */
  constructor(privateKeySupplier: () => string,
              publicCertSupplier: () => string,
              options?: JwtSignerOptions) {
    this.privateKeySupplier = privateKeySupplier
    this.publicCertSupplier = publicCertSupplier

    this.privateKey = '';
    this.publicCert = '';

    this.signOptions = {
      ...defaultSignOptions,
      ...options?.signOptions,
    };
    this.verifyOptions = {
      ...defaultVerifyOptions,
      ...options?.verifyOptions,
    };
  }

  private _loadKeys() {
    if (this.privateKey === '') {
      this.privateKey = this.privateKeySupplier();
    }
    if (this.publicCert === '') {
      this.publicCert = this.publicCertSupplier();
    }
  }

  async sign<T extends object>(payload: T): Promise<string> {
    this._loadKeys();
    try {
      return new Promise((resolve, reject) => {
        jwt.sign(payload, this.privateKey, this.signOptions, (err, data) => {
          if (err !== null) {
            reject(err);
          } else {
            resolve(data!);
          }
        });
      });
    } catch (err) {
      const error = new JwtSigningError('Error signing jwt token', ensureError(err));
      logger.error(error, 'Error signing jwt token');
      throw error;
    }
  }

  async verify<T extends object>(token: string): Promise<T> {
    this._loadKeys();
    try {
      return new Promise((resolve, reject) => {
        jwt.verify(token, this.publicCert, this.verifyOptions, (err, decoded) => {
          if (err !== null) {
            reject(err);
          } else {
            resolve(decoded as T);
          }
        })
      });
    } catch (err) {
      const error = new JwtVerifyError('Error verifying jwt token', ensureError(err));
      logger.error(error, 'Error verifying jwt token');
      throw error;
    }
  }
}

export class JwtSigningError extends FeralError {
  constructor(message: string, cause?: FeralError) {
    super(message, cause);
    this.name = 'JwtSigningError';
    this.status = 500;
  }
}

export class JwtVerifyError extends FeralError {
  constructor(message: string, cause?: FeralError) {
    super(message, cause);
    this.name = 'JwtVerifyError';
    this.status = 500;
  }
}
