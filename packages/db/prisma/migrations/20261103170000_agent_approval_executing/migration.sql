-- Add an execution-claim state so an approved mutation can be claimed by one worker.
ALTER TYPE "AgentApprovalStatus" ADD VALUE IF NOT EXISTS 'EXECUTING' AFTER 'REJECTED';
