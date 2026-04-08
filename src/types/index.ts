// Re-export Prisma model types
export type { OrganizationModel as Organization } from "@/generated/prisma/models/Organization";
export type { UserModel as User } from "@/generated/prisma/models/User";
export type { TeamModel as Team } from "@/generated/prisma/models/Team";
export type { PipelineModel as Pipeline } from "@/generated/prisma/models/Pipeline";
export type { PipelineStageModel as PipelineStage } from "@/generated/prisma/models/PipelineStage";
export type { DealModel as Deal } from "@/generated/prisma/models/Deal";
export type { ContactModel as Contact } from "@/generated/prisma/models/Contact";
export type { CompanyModel as Company } from "@/generated/prisma/models/Company";
export type { TaskModel as Task } from "@/generated/prisma/models/Task";
export type { ActivityModel as Activity } from "@/generated/prisma/models/Activity";
export type { CustomFieldModel as CustomField } from "@/generated/prisma/models/CustomField";
export type { CustomFieldValueModel as CustomFieldValue } from "@/generated/prisma/models/CustomFieldValue";

// Re-export enums
export {
  Role,
  BusinessMode,
  Priority,
  TaskType,
  TaskStatus,
  ActivityType,
  FieldType,
  EntityType,
} from "@/generated/prisma/enums";

// --- Composite types ---

import type { DealModel } from "@/generated/prisma/models/Deal";
import type { ContactModel } from "@/generated/prisma/models/Contact";
import type { CompanyModel } from "@/generated/prisma/models/Company";
import type { PipelineStageModel } from "@/generated/prisma/models/PipelineStage";
import type { UserModel } from "@/generated/prisma/models/User";
import type { TaskModel } from "@/generated/prisma/models/Task";
import type { Role } from "@/generated/prisma/enums";

export interface DealWithRelations extends DealModel {
  contact: ContactModel;
  company: CompanyModel | null;
  stage: PipelineStageModel;
  assignedTo: UserModel;
}

export interface ContactWithCompany extends ContactModel {
  company: CompanyModel | null;
}

export interface TaskWithRelations extends TaskModel {
  deal: DealModel | null;
  contact: ContactModel;
  assignedTo: UserModel;
}

// --- Auth ---

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  teamId: string | null;
}
