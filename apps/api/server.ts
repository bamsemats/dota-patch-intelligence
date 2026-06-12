import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

fastify.register(cors, {
  origin: '*', 
});

fastify.get('/api/health', async () => {
  return { status: 'ok' };
});

// 1. Get all available patches
fastify.get('/api/patches', async () => {
  const patches = await prisma.patch.findMany({
    orderBy: { version: 'desc' }, // Can be customized later for semantic sorting
    select: { version: true, releaseDate: true }
  });
  return patches.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
});

// 2. Get specific patch details (Entities and Changes)
fastify.get('/api/patches/:version', async (request, reply) => {
  const { version } = request.params as { version: string };
  
  const patch = await prisma.patch.findUnique({
    where: { version },
    include: {
      changes: {
        include: { entity: true }
      },
      featureVectors: {
        include: { entity: true }
      },
      winrateSnapshots: {
        include: { entity: true }
      }
    }
  });

  if (!patch) {
    return reply.status(404).send({ error: "Patch not found" });
  }

  return patch;
});

// 3. Get LLM Meta Analysis for a specific patch
fastify.get('/api/patches/:version/meta', async (request, reply) => {
  const { version } = request.params as { version: string };
  
  const patch = await prisma.patch.findUnique({
    where: { version },
    include: { metaAnalysis: true }
  });

  if (!patch || !patch.metaAnalysis) {
    return reply.status(404).send({ error: "Meta Analysis not found" });
  }

  return patch.metaAnalysis;
});

// 4. Get Hero History (Changes, Vectors, Winrates across all patches)
fastify.get('/api/heroes/:name/history', async (request, reply) => {
  const { name } = request.params as { name: string };
  
  // Try to find the hero case-insensitively using prisma standard query or by formatting
  const formattedName = name.replace(/_/g, ' ');
  
  const entity = await prisma.entity.findFirst({
    where: { 
      name: { equals: formattedName, mode: 'insensitive' },
      type: "HERO"
    },
    include: {
      changes: {
        include: { patch: true }
      },
      featureVectors: {
        include: { patch: true }
      },
      winrateSnapshots: {
        include: { patch: true }
      }
    }
  });

  if (!entity) {
    return reply.status(404).send({ error: "Hero not found" });
  }

  return entity;
});

// 5. Get all heroes
fastify.get('/api/heroes', async () => {
  const heroes = await prisma.entity.findMany({
    where: { type: "HERO" },
    select: { name: true }
  });
  return heroes.sort((a, b) => a.name.localeCompare(b.name));
});

// 6. Global Search
fastify.get('/api/search', async (request, reply) => {
  const { q } = request.query as { q?: string };
  if (!q || q.length < 2) return [];

  const changes = await prisma.patchChange.findMany({
    where: {
      OR: [
        { rawNote: { contains: q, mode: 'insensitive' } },
        { subEntityName: { contains: q, mode: 'insensitive' } },
        { entity: { name: { contains: q, mode: 'insensitive' } } }
      ]
    },
    include: {
      patch: true,
      entity: true
    },
    take: 100
  });

  return changes.map(c => ({
    v: c.patch.version,
    e: c.entity.name,
    s: c.subEntityName || "",
    c: c.classificationType,
    n: c.rawNote.substring(0, 100),
    cat: c.entity.type.toLowerCase()
  }));
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
    console.log(`Server listening on port 8080`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
