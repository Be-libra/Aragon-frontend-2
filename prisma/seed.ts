import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();

  await prisma.board.create({
    data: {
      name: "Platform Launch",
      columns: {
        create: [
          {
            name: "Todo",
            position: 0,
            tasks: {
              create: [
                {
                  title: "Build UI for onboarding flow",
                  description: "Create the onboarding screens and interactions.",
                  position: 0,
                  subtasks: {
                    create: [
                      { title: "Sign up page", position: 0 },
                      { title: "Onboarding flow content", position: 1 },
                      { title: "Empty state polish", position: 2 }
                    ]
                  }
                },
                {
                  title: "Build UI for search",
                  position: 1,
                  subtasks: {
                    create: [{ title: "Search results list", position: 0 }]
                  }
                },
                {
                  title: "Build settings UI",
                  position: 2,
                  subtasks: {
                    create: [
                      { title: "Profile form", position: 0 },
                      { title: "Notifications form", position: 1 }
                    ]
                  }
                },
                {
                  title: "QA and test all major user journeys",
                  position: 3,
                  subtasks: {
                    create: [
                      { title: "Desktop smoke test", position: 0 },
                      { title: "Mobile smoke test", position: 1 }
                    ]
                  }
                }
              ]
            }
          },
          {
            name: "Doing",
            position: 1,
            tasks: {
              create: [
                {
                  title: "Design settings and search pages",
                  position: 0,
                  subtasks: {
                    create: [
                      { title: "Settings page exploration", position: 0, isCompleted: true },
                      { title: "Search page wireframes", position: 1 },
                      { title: "Final design review", position: 2 }
                    ]
                  }
                },
                {
                  title: "Add account management endpoints",
                  position: 1,
                  subtasks: {
                    create: [
                      { title: "Create endpoint", position: 0, isCompleted: true },
                      { title: "Update endpoint", position: 1, isCompleted: true },
                      { title: "Delete endpoint", position: 2 }
                    ]
                  }
                }
              ]
            }
          },
          {
            name: "Done",
            position: 2,
            tasks: {
              create: [
                {
                  title: "Conduct 5 wireframe tests",
                  position: 0,
                  subtasks: {
                    create: [{ title: "Testing complete", position: 0, isCompleted: true }]
                  }
                },
                {
                  title: "Create wireframe prototype",
                  position: 1,
                  subtasks: {
                    create: [{ title: "Prototype complete", position: 0, isCompleted: true }]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  await prisma.board.create({
    data: {
      name: "Marketing Plan",
      columns: {
        create: [
          { name: "Ideas", position: 0 },
          { name: "Planned", position: 1 },
          { name: "Published", position: 2 }
        ]
      }
    }
  });

  await prisma.board.create({
    data: {
      name: "Roadmap",
      columns: {
        create: [
          { name: "Backlog", position: 0 },
          { name: "Next Up", position: 1 },
          { name: "Released", position: 2 }
        ]
      }
    }
  });
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
