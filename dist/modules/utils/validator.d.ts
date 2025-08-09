import { Request, Response, NextFunction } from "express";
type ValidationRule = {
    field: string;
    required?: boolean;
    type?: "string" | "number" | "boolean" | "array" | "object";
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
};
type ValidationSchema = {
    body?: ValidationRule[];
    query?: ValidationRule[];
    params?: ValidationRule[];
};
export declare const validateRequest: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validationRules: {
    requiredString: (field: string, maxLength?: number) => ValidationRule;
    optionalString: (field: string, maxLength?: number) => ValidationRule;
    email: (field: string) => ValidationRule;
    phone: (field: string) => ValidationRule;
    requiredNumber: (field: string, min?: number, max?: number) => ValidationRule;
    optionalNumber: (field: string, min?: number, max?: number) => ValidationRule;
    requiredBoolean: (field: string) => ValidationRule;
    requiredArray: (field: string, minLength?: number, maxLength?: number) => ValidationRule;
    requiredObject: (field: string) => ValidationRule;
    id: (field: string) => ValidationRule;
    enum: (field: string, values: any[]) => ValidationRule;
    custom: (field: string, validator: (value: any) => boolean | string) => ValidationRule;
};
export declare const commonSchemas: {
    pagination: {
        query: ValidationRule[];
    };
    idParam: {
        params: ValidationRule[];
    };
    search: {
        query: ValidationRule[];
    };
};
export {};
//# sourceMappingURL=validator.d.ts.map