import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const patch = await prisma.patch.findUnique({
    where: { version: '7.41d' }
  });
  console.log('Patch 7.41d data:', patch);

  const change = await prisma.patchChange.findFirst({
    where: { originalSource: { not: null } }
  });
  console.log('Change with originalSource:', change ? { id: change.id, originalSource: change.originalSource, rawNote: change.rawNote } : 'None');

  const meta = await prisma.metaAnalysis.findFirst({
      where: { analysisVersion: { gt: -1 } }
  });
  console.log('MetaAnalysis with versioning:', meta ? { id: meta.id, analysisVersion: meta.analysisVersion } : 'None');
}

check().catch(console.error).finally(() => prisma.$disconnect());
