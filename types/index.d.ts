declare module 'dataguard' {
  interface ComplianceContext {
    country?: string;
    action?: string;
    ipAddress?: string;
    userAgent?: string;
    marketingConsent?: boolean;
    analyticsConsent?: boolean;
  }

  interface ComplianceResult {
    success: boolean;
    data: any;
    compliance: {
      applicableLaws: string[];
      processingTime: number;
      actions: string[];
    };
    warnings: Array<{
      level: string;
      message: string;
      field?: string;
      recommendation?: string;
    }>;
  }

  interface DeletionResult {
    success: boolean;
    message: string;
    actions: string[];
    estimatedCompletion: string;
  }

  export function makeCompliant(data: any, context?: ComplianceContext): Promise<ComplianceResult>;
  export function handleDeletionRequest(userId: string, regulation?: string): Promise<DeletionResult>;
  export function classifyData(data: any): Promise<any[]>;
  export function createDataGuard(config?: any): any;
  export function getDefaultInstance(): any;
}

declare module 'dataguard/web/express' {
  import { RequestHandler } from 'express';

  export function dataGuardMiddleware(options?: any): RequestHandler;
  export function dataGuardResponseMiddleware(options?: any): RequestHandler;
  export function requireCompliance(requiredLaws?: string[]): RequestHandler;
  export function requireGDPRCompliance(): RequestHandler;
  export function validateConsent(requiredConsentTypes?: string[]): RequestHandler;
  export function dataGuardErrorHandler(): RequestHandler;
}

declare module 'dataguard/integrations/mongodb' {
  export class MongoDBIntegration {
    constructor(dataGuard: any, mongoConfig?: any);
    initialize(): Promise<void>;
    createCompliant(collectionName: string, data: any, context?: any): Promise<any>;
    findCompliant(collectionName: string, query?: any, options?: any): Promise<any[]>;
    handleUserDeletion(userId: string, regulation?: string, options?: any): Promise<any>;
    getComplianceStats(): Promise<any>;
    createComplianceIndexes(): Promise<void>;
    close(): Promise<void>;
  }
}

declare module 'dataguard/integrations/mysql' {
  export class MySQLIntegration {
    constructor(dataGuard: any, mysqlConfig?: any);
    initialize(): Promise<void>;
    createCompliant(tableName: string, data: any, context?: any): Promise<any>;
    findCompliant(tableName: string, whereClause?: string, params?: any[]): Promise<any[]>;
    setupComplianceTables(): Promise<void>;
  }
}