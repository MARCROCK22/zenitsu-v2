import prisma from '@prisma/client';

const client = new prisma.PrismaClient({
    rejectOnNotFound: false,
});
client.$connect()
    .then(() => {
        console.log('Connected to Prisma');
    });

export const prismaClient = client;