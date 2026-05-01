import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ids = {
  org: '11111111-1111-4111-8111-111111111111',
  teamEngineering: '22222222-2222-4222-8222-222222222221',
  teamOperations: '22222222-2222-4222-8222-222222222222',
  managerUser: '33333333-3333-4333-8333-333333333331',
  employeeUser: '33333333-3333-4333-8333-333333333332',
  managerMembership: '44444444-4444-4444-8444-444444444441',
  employeeMembership: '44444444-4444-4444-8444-444444444442',
  meeting: '55555555-5555-4555-8555-555555555551',
  participant1: '66666666-6666-4666-8666-666666666661',
  participant2: '66666666-6666-4666-8666-666666666662',
  audioAsset: '77777777-7777-4777-8777-777777777771',
  transcript: '88888888-8888-4888-8888-888888888881',
  promptTemplate: '99999999-9999-4999-8999-999999999991',
  promptVersion: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  aiRun: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  extractionResult: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  actionItem: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  assignment: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  statusHistory: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
  notification: '12121212-1212-4121-8121-121212121212',
};

async function main() {
  const now = new Date();
  const retentionDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const organization = await prisma.organization.upsert({
    where: { id: ids.org },
    update: {
      name: 'HyperBuild Pilot Org',
      slug: 'hyperbuild-pilot',
      retentionDays: 90,
    },
    create: {
      id: ids.org,
      name: 'HyperBuild Pilot Org',
      slug: 'hyperbuild-pilot',
      retentionDays: 90,
    },
  });

  const engineeringTeam = await prisma.team.upsert({
    where: { id: ids.teamEngineering },
    update: { name: 'Engineering', slug: 'engineering' },
    create: {
      id: ids.teamEngineering,
      organizationId: organization.id,
      name: 'Engineering',
      slug: 'engineering',
    },
  });

  await prisma.team.upsert({
    where: { id: ids.teamOperations },
    update: { name: 'Operations', slug: 'operations' },
    create: {
      id: ids.teamOperations,
      organizationId: organization.id,
      name: 'Operations',
      slug: 'operations',
    },
  });

  const manager = await prisma.user.upsert({
    where: { id: ids.managerUser },
    update: {
      email: 'manager@hyperbuild.dev',
      displayName: 'Avery Manager',
      externalAuthId: 'clerk_manager_avery',
    },
    create: {
      id: ids.managerUser,
      email: 'manager@hyperbuild.dev',
      displayName: 'Avery Manager',
      externalAuthId: 'clerk_manager_avery',
    },
  });

  const employee = await prisma.user.upsert({
    where: { id: ids.employeeUser },
    update: {
      email: 'employee@hyperbuild.dev',
      displayName: 'Jordan Employee',
      externalAuthId: 'clerk_employee_jordan',
    },
    create: {
      id: ids.employeeUser,
      email: 'employee@hyperbuild.dev',
      displayName: 'Jordan Employee',
      externalAuthId: 'clerk_employee_jordan',
    },
  });

  await prisma.membership.upsert({
    where: { id: ids.managerMembership },
    update: {
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      userId: manager.id,
      role: 'manager',
    },
    create: {
      id: ids.managerMembership,
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      userId: manager.id,
      role: 'manager',
    },
  });

  await prisma.membership.upsert({
    where: { id: ids.employeeMembership },
    update: {
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      userId: employee.id,
      role: 'employee',
    },
    create: {
      id: ids.employeeMembership,
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      userId: employee.id,
      role: 'employee',
    },
  });

  const meeting = await prisma.meeting.upsert({
    where: { id: ids.meeting },
    update: {
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      uploadedByMemberId: ids.managerMembership,
      title: 'Weekly Engineering Sync',
      status: 'tasks_created',
      source: 'sample-seed',
      scheduledAt: now,
      retentionUntil: retentionDate,
    },
    create: {
      id: ids.meeting,
      organizationId: organization.id,
      teamId: engineeringTeam.id,
      uploadedByMemberId: ids.managerMembership,
      title: 'Weekly Engineering Sync',
      status: 'tasks_created',
      source: 'sample-seed',
      scheduledAt: now,
      retentionUntil: retentionDate,
    },
  });

  await prisma.meetingParticipant.upsert({
    where: { id: ids.participant1 },
    update: {
      meetingId: meeting.id,
      userId: manager.id,
      displayName: manager.displayName,
      email: manager.email,
      speakerLabel: 'spk_0',
    },
    create: {
      id: ids.participant1,
      meetingId: meeting.id,
      userId: manager.id,
      displayName: manager.displayName,
      email: manager.email,
      speakerLabel: 'spk_0',
    },
  });

  await prisma.meetingParticipant.upsert({
    where: { id: ids.participant2 },
    update: {
      meetingId: meeting.id,
      userId: employee.id,
      displayName: employee.displayName,
      email: employee.email,
      speakerLabel: 'spk_1',
    },
    create: {
      id: ids.participant2,
      meetingId: meeting.id,
      userId: employee.id,
      displayName: employee.displayName,
      email: employee.email,
      speakerLabel: 'spk_1',
    },
  });

  await prisma.audioAsset.upsert({
    where: { id: ids.audioAsset },
    update: {
      meetingId: meeting.id,
      storageKey: 'meetings/weekly-engineering-sync.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: BigInt(25200123),
      durationSec: 1820,
      checksum: 'sha256:samplechecksum',
      encryptionKeyVersion: 'v1',
      retentionUntil: retentionDate,
      deletedAt: null,
    },
    create: {
      id: ids.audioAsset,
      meetingId: meeting.id,
      storageKey: 'meetings/weekly-engineering-sync.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: BigInt(25200123),
      durationSec: 1820,
      checksum: 'sha256:samplechecksum',
      encryptionKeyVersion: 'v1',
      retentionUntil: retentionDate,
      deletedAt: null,
    },
  });

  await prisma.transcript.upsert({
    where: { id: ids.transcript },
    update: {
      meetingId: meeting.id,
      language: 'en',
      provider: 'hf-whisper',
      status: 'complete',
      rawText: 'Jordan will send the release notes by Friday.',
      confidence: 0.92,
      retentionUntil: retentionDate,
    },
    create: {
      id: ids.transcript,
      meetingId: meeting.id,
      language: 'en',
      provider: 'hf-whisper',
      status: 'complete',
      rawText: 'Jordan will send the release notes by Friday.',
      confidence: 0.92,
      retentionUntil: retentionDate,
    },
  });

  await prisma.utterance.deleteMany({ where: { transcriptId: ids.transcript } });
  await prisma.utterance.createMany({
    data: [
      {
        transcriptId: ids.transcript,
        segmentIndex: 0,
        speakerLabel: 'spk_0',
        startMs: 0,
        endMs: 12000,
        text: 'Let us finalize the release checklist today.',
        confidence: 0.95,
      },
      {
        transcriptId: ids.transcript,
        segmentIndex: 1,
        speakerLabel: 'spk_1',
        startMs: 12000,
        endMs: 25000,
        text: 'I will send release notes and rollback steps by Friday.',
        confidence: 0.91,
      },
    ],
  });

  await prisma.promptTemplate.upsert({
    where: { id: ids.promptTemplate },
    update: {
      key: 'action_item_extraction',
      name: 'Action Item Extraction',
      description: 'Extract tasks, owners, and due dates from transcripts.',
    },
    create: {
      id: ids.promptTemplate,
      key: 'action_item_extraction',
      name: 'Action Item Extraction',
      description: 'Extract tasks, owners, and due dates from transcripts.',
    },
  });

  await prisma.promptVersion.upsert({
    where: { id: ids.promptVersion },
    update: {
      promptTemplateId: ids.promptTemplate,
      version: 1,
      modelId: 'mistralai/Mistral-7B-Instruct-v0.3',
      temperature: 0.1,
      maxTokens: 1200,
      templateText: 'Extract strict JSON action items from transcript chunks.',
      isActive: true,
    },
    create: {
      id: ids.promptVersion,
      promptTemplateId: ids.promptTemplate,
      version: 1,
      modelId: 'mistralai/Mistral-7B-Instruct-v0.3',
      temperature: 0.1,
      maxTokens: 1200,
      templateText: 'Extract strict JSON action items from transcript chunks.',
      isActive: true,
    },
  });

  await prisma.aiRun.upsert({
    where: { id: ids.aiRun },
    update: {
      organizationId: organization.id,
      meetingId: meeting.id,
      promptVersionId: ids.promptVersion,
      provider: 'huggingface',
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      status: 'succeeded',
      idempotencyKey: `meeting:${meeting.id}:v1`,
      inputTokens: 980,
      outputTokens: 180,
      costUsd: '0.0215',
      startedAt: now,
      finishedAt: now,
      errorMessage: null,
    },
    create: {
      id: ids.aiRun,
      organizationId: organization.id,
      meetingId: meeting.id,
      promptVersionId: ids.promptVersion,
      provider: 'huggingface',
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      status: 'succeeded',
      idempotencyKey: `meeting:${meeting.id}:v1`,
      inputTokens: 980,
      outputTokens: 180,
      costUsd: '0.0215',
      startedAt: now,
      finishedAt: now,
    },
  });

  await prisma.extractionResult.upsert({
    where: { id: ids.extractionResult },
    update: {
      aiRunId: ids.aiRun,
      schemaVersion: '1.0.0',
      rawOutput: {
        actionItems: [
          {
            title: 'Send release notes and rollback steps',
            ownerCandidate: 'Jordan Employee',
            dueDate: now.toISOString(),
            priority: 'high',
            confidence: 0.88,
            rationale: 'Commitment made explicitly by speaker spk_1.',
          },
        ],
      },
      normalizedOutput: {
        actionItems: [
          {
            title: 'Send release notes and rollback steps',
            ownerUserId: employee.id,
            dueDate: now.toISOString(),
            priority: 'high',
            confidence: 0.88,
          },
        ],
      },
      validationPassed: true,
      retryCount: 0,
    },
    create: {
      id: ids.extractionResult,
      aiRunId: ids.aiRun,
      schemaVersion: '1.0.0',
      rawOutput: {
        actionItems: [
          {
            title: 'Send release notes and rollback steps',
            ownerCandidate: 'Jordan Employee',
            dueDate: now.toISOString(),
            priority: 'high',
            confidence: 0.88,
            rationale: 'Commitment made explicitly by speaker spk_1.',
          },
        ],
      },
      normalizedOutput: {
        actionItems: [
          {
            title: 'Send release notes and rollback steps',
            ownerUserId: employee.id,
            dueDate: now.toISOString(),
            priority: 'high',
            confidence: 0.88,
          },
        ],
      },
      validationPassed: true,
      retryCount: 0,
    },
  });

  await prisma.actionItem.upsert({
    where: { id: ids.actionItem },
    update: {
      organizationId: organization.id,
      meetingId: meeting.id,
      createdByAiRunId: ids.aiRun,
      title: 'Send release notes and rollback steps',
      description: 'Prepare notes for release channel and attach rollback instructions.',
      status: 'todo',
      priority: 'high',
      dueDate: retentionDate,
      confidence: 0.88,
      rationale: 'Owner and due date were identified with high confidence.',
      humanReviewRequired: false,
      completedAt: null,
    },
    create: {
      id: ids.actionItem,
      organizationId: organization.id,
      meetingId: meeting.id,
      createdByAiRunId: ids.aiRun,
      title: 'Send release notes and rollback steps',
      description: 'Prepare notes for release channel and attach rollback instructions.',
      status: 'todo',
      priority: 'high',
      dueDate: retentionDate,
      confidence: 0.88,
      rationale: 'Owner and due date were identified with high confidence.',
      humanReviewRequired: false,
    },
  });

  await prisma.taskAssignment.upsert({
    where: { id: ids.assignment },
    update: {
      actionItemId: ids.actionItem,
      userId: employee.id,
      assignedByUserId: manager.id,
      source: 'ai',
    },
    create: {
      id: ids.assignment,
      actionItemId: ids.actionItem,
      userId: employee.id,
      assignedByUserId: manager.id,
      source: 'ai',
    },
  });

  await prisma.taskStatusHistory.upsert({
    where: { id: ids.statusHistory },
    update: {
      actionItemId: ids.actionItem,
      fromStatus: null,
      toStatus: 'todo',
      changedByUserId: manager.id,
      reason: 'Initial extraction from meeting transcript.',
    },
    create: {
      id: ids.statusHistory,
      actionItemId: ids.actionItem,
      fromStatus: null,
      toStatus: 'todo',
      changedByUserId: manager.id,
      reason: 'Initial extraction from meeting transcript.',
    },
  });

  await prisma.notification.upsert({
    where: { id: ids.notification },
    update: {
      organizationId: organization.id,
      userId: employee.id,
      channel: 'in_app',
      status: 'pending',
      templateKey: 'task_assigned',
      payload: {
        actionItemId: ids.actionItem,
        meetingId: meeting.id,
        title: 'Send release notes and rollback steps',
      },
      scheduledFor: now,
      sentAt: null,
      readAt: null,
    },
    create: {
      id: ids.notification,
      organizationId: organization.id,
      userId: employee.id,
      channel: 'in_app',
      status: 'pending',
      templateKey: 'task_assigned',
      payload: {
        actionItemId: ids.actionItem,
        meetingId: meeting.id,
        title: 'Send release notes and rollback steps',
      },
      scheduledFor: now,
    },
  });

  console.log('Phase 2 seed complete: org, teams, users, meeting intelligence sample graph created.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
