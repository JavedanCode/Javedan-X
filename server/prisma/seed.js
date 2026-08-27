import { prisma } from '../src/db/prisma.js';
import { hashPassword } from '../src/services/password.service.js';

const DEMO_PASSWORD = 'DemoPassword123!';

const users = [
  {
    username: 'clarkegriffin',
    email: 'clarke@example.com',
    displayName: 'Clarke Griffin',
    bio: 'Trying to keep everyone alive. Again.',
    avatarUrl: 'https://i.pravatar.cc/300?img=47',
  },
  {
    username: 'bellamyblake',
    email: 'bellamy@example.com',
    displayName: 'Bellamy Blake',
    bio: 'Maybe the real enemy was the friends we made along the way.',
    avatarUrl: 'https://i.pravatar.cc/300?img=12',
  },
  {
    username: 'ravenreyes',
    email: 'raven@example.com',
    displayName: 'Raven Reyes',
    bio: 'Engineer. Mechanic. Professional problem solver.',
    avatarUrl: 'https://i.pravatar.cc/300?img=44',
  },
  {
    username: 'octaviablake',
    email: 'octavia@example.com',
    displayName: 'Octavia Blake',
    bio: 'You don’t need a throne to be a leader.',
    avatarUrl: 'https://i.pravatar.cc/300?img=32',
  },
  {
    username: 'murphylives',
    email: 'murphy@example.com',
    displayName: 'John Murphy',
    bio: 'Survived things I definitely should not have survived.',
    avatarUrl: 'https://i.pravatar.cc/300?img=68',
  },
  {
    username: 'lincolngreen',
    email: 'lincoln@example.com',
    displayName: 'Lincoln Green',
    bio: 'Peace is harder than war. Worth it anyway.',
    avatarUrl: 'https://i.pravatar.cc/300?img=11',
  },
  {
    username: 'emilycarter',
    email: 'emily@example.com',
    displayName: 'Emily Carter',
    bio: 'Coffee, code, and questionable life decisions.',
    avatarUrl: 'https://i.pravatar.cc/300?img=5',
  },
  {
    username: 'alexmorgan',
    email: 'alex@example.com',
    displayName: 'Alex Morgan',
    bio: 'Building things and breaking things professionally.',
    avatarUrl: 'https://i.pravatar.cc/300?img=15',
  },
  {
    username: 'noraellis',
    email: 'nora@example.com',
    displayName: 'Nora Ellis',
    bio: 'Writer, reader, occasional internet philosopher.',
    avatarUrl: 'https://i.pravatar.cc/300?img=25',
  },
  {
    username: 'danielpark',
    email: 'daniel@example.com',
    displayName: 'Daniel Park',
    bio: 'Software engineer. Amateur photographer.',
    avatarUrl: 'https://i.pravatar.cc/300?img=13',
  },
  {
    username: 'mayachen',
    email: 'maya@example.com',
    displayName: 'Maya Chen',
    bio: 'Trying to make the internet slightly less chaotic.',
    avatarUrl: 'https://i.pravatar.cc/300?img=23',
  },
  {
    username: 'ethanross',
    email: 'ethan@example.com',
    displayName: 'Ethan Ross',
    bio: 'Running on caffeine and optimism.',
    avatarUrl: 'https://i.pravatar.cc/300?img=60',
  },
  {
    username: 'sarahstone',
    email: 'sarah@example.com',
    displayName: 'Sarah Stone',
    bio: 'Sometimes I post. Sometimes I disappear for three weeks.',
    avatarUrl: 'https://i.pravatar.cc/300?img=49',
  },
  {
    username: 'noahwilliams',
    email: 'noah@example.com',
    displayName: 'Noah Williams',
    bio: 'Movies, music, games, and too many opinions.',
    avatarUrl: 'https://i.pravatar.cc/300?img=56',
  },
  {
    username: 'jordanlee',
    email: 'jordan@example.com',
    displayName: 'Jordan Lee',
    bio: 'Making mistakes and calling it character development.',
    avatarUrl: 'https://i.pravatar.cc/300?img=8',
  },
];

const postData = [
  {
    username: 'clarkegriffin',
    content:
      'Just finished rewatching The 100 and I still can’t decide whether making impossible decisions is a leadership skill or a terrible personality trait.',
  },
  {
    username: 'clarkegriffin',
    content:
      'Reminder: if your survival plan requires everyone to agree with you, it probably isn’t a very good survival plan.',
  },
  {
    username: 'clarkegriffin',
    content:
      'The real superpower would be getting everyone in a room and having one conversation without someone threatening to leave.',
  },
  {
    username: 'clarkegriffin',
    content: 'Hot take: the bunker arc deserved more time. There was so much potential there.',
  },
  {
    username: 'clarkegriffin',
    content:
      'Sometimes being the person with the plan just means everyone knows exactly who to blame when it goes wrong.',
  },
  {
    username: 'clarkegriffin',
    content:
      'I would like one normal day. No war. No apocalypse. No impossible moral dilemma. Just coffee.',
  },
  {
    username: 'clarkegriffin',
    content:
      'Still thinking about the question: what does “doing better” actually look like when there are no good choices?',
  },
  {
    username: 'clarkegriffin',
    content: 'Anyway. Hope everyone is having a better day than the people on this show.',
  },

  {
    username: 'bellamyblake',
    content:
      'Started a rewatch last night. Somehow every episode makes me say “this is definitely going to end badly.”',
  },
  {
    username: 'bellamyblake',
    content:
      'Leadership is mostly pretending you know what you’re doing until everyone else believes you.',
  },
  {
    username: 'ravenreyes',
    content:
      'Nothing like fixing one problem only to discover that you accidentally created three new ones.',
  },
  {
    username: 'ravenreyes',
    content:
      'If someone says “it should be a quick fix,” they are legally required to help fix it.',
  },
  {
    username: 'octaviablake',
    content: 'Hot take: being underestimated is actually pretty useful.',
  },
  {
    username: 'octaviablake',
    content: 'Some people need a five-year plan. I need five minutes and a sword.',
  },
  {
    username: 'murphylives',
    content:
      'I have survived enough terrible situations to officially stop being surprised by terrible situations.',
  },
  {
    username: 'murphylives',
    content: 'Everyone talks about redemption arcs until they have to actually forgive somebody.',
  },
  {
    username: 'lincolngreen',
    content: 'Peace sounds simple until you realize how many people benefit from conflict.',
  },
  {
    username: 'emilycarter',
    content:
      'Spent six hours debugging something that turned out to be a missing semicolon. I would like compensation.',
  },
  {
    username: 'alexmorgan',
    content:
      'There are two kinds of programmers: people who back up their files and people who are about to learn why they should.',
  },
  {
    username: 'noraellis',
    content:
      'Finished a book at 2 AM because apparently sleep is optional when the ending is good.',
  },
  {
    username: 'danielpark',
    content:
      'Found a tiny coffee shop with the best espresso I’ve had all month. Not sharing the location.',
  },
  {
    username: 'mayachen',
    content:
      'The internet has convinced me that everyone has a strong opinion about everything. I’m choosing to have a strong opinion about taking a nap.',
  },
  {
    username: 'ethanross',
    content:
      'I made a to-do list today and immediately became exhausted by the amount of work I apparently wanted to do.',
  },
  {
    username: 'sarahstone',
    content: 'Logging back in after disappearing for three weeks. What did I miss?',
  },
  {
    username: 'noahwilliams',
    content:
      'Movie recommendation: watch something you know nothing about. No reviews, no trailers, no spoilers. It’s weirdly refreshing.',
  },
  {
    username: 'jordanlee',
    content:
      'Today’s character development: admitting I was wrong before someone else had the opportunity to point it out.',
  },
];

const commentData = [
  {
    post: 0,
    username: 'ravenreyes',
    content: 'Definitely a personality trait. Leadership is overrated.',
  },
  {
    post: 0,
    username: 'bellamyblake',
    content: 'You say that like we had better options.',
  },
  {
    post: 0,
    username: 'murphylives',
    content: 'I vote terrible personality trait.',
  },
  {
    post: 1,
    username: 'octaviablake',
    content: 'That sounds suspiciously like experience talking.',
  },
  {
    post: 2,
    username: 'ravenreyes',
    content: 'I would settle for one meeting where nobody says “we need a plan.”',
  },
  {
    post: 3,
    username: 'noraellis',
    content: 'Agreed. That whole storyline could have been its own season.',
  },
  {
    post: 4,
    username: 'bellamyblake',
    content: 'You forgot the part where everyone blames you anyway.',
  },
  {
    post: 5,
    username: 'emilycarter',
    content: 'Honestly, coffee would solve at least 30% of these problems.',
  },
  {
    post: 7,
    username: 'murphylives',
    content: 'Finally, something we can all agree on.',
  },
  {
    post: 8,
    username: 'clarkegriffin',
    content: 'That feeling never goes away.',
  },
  {
    post: 9,
    username: 'ravenreyes',
    content: 'That is unfortunately very accurate.',
  },
  {
    post: 10,
    username: 'alexmorgan',
    content: 'I felt this one.',
  },
  {
    post: 11,
    username: 'clarkegriffin',
    content: 'This is why I don’t trust the words “quick fix.”',
  },
  {
    post: 12,
    username: 'lincolngreen',
    content: 'Being underestimated can be powerful.',
  },
  {
    post: 14,
    username: 'bellamyblake',
    content: 'Three weeks? Rookie numbers.',
  },
  {
    post: 15,
    username: 'noraellis',
    content: 'That is exactly how you end up watching until sunrise.',
  },
  {
    post: 16,
    username: 'mayachen',
    content: 'A nap is absolutely a valid productivity strategy.',
  },
  {
    post: 17,
    username: 'jordanlee',
    content: 'Character development unlocked.',
  },
];

async function main() {
  console.log('🌱 Starting database seed...');

  /*
   * This is intentionally a complete reset.
   *
   * The schema uses cascading deletes from User, so deleting users
   * removes posts, comments, likes, follows, sessions, etc.
   */
  await prisma.user.deleteMany();

  console.log('Cleared existing users and related data.');

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const userMap = new Map();

  for (const user of users) {
    const createdUser = await prisma.user.create({
      data: {
        ...user,
        passwordHash,
        emailVerifiedAt: new Date(),
      },
    });

    userMap.set(user.username, createdUser);
  }

  const demoUser = userMap.get('clarkegriffin');

  /*
   * Create posts.
   *
   * Give each post a slightly different timestamp so the feed
   * looks like it has accumulated naturally over time.
   */
  const posts = [];

  for (let index = 0; index < postData.length; index += 1) {
    const data = postData[index];
    const author = userMap.get(data.username);

    const createdAt = new Date(Date.now() - (postData.length - index) * 1000 * 60 * 60 * 7);

    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        content: data.content,
        createdAt,
      },
    });

    posts.push(post);
  }

  console.log(`Created ${posts.length} posts.`);

  /*
   * Create comments.
   */
  for (const comment of commentData) {
    const post = posts[comment.post];
    const author = userMap.get(comment.username);

    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: author.id,
        content: comment.content,
        createdAt: new Date(post.createdAt.getTime() + 1000 * 60 * 30),
      },
    });
  }

  console.log(`Created ${commentData.length} comments.`);

  /*
   * Create likes.
   *
   * Each post receives several likes from different users.
   * The deterministic pattern keeps the seed repeatable.
   */
  for (let postIndex = 0; postIndex < posts.length; postIndex += 1) {
    const post = posts[postIndex];

    const numberOfLikes = 3 + (postIndex % 6);

    for (let offset = 0; offset < numberOfLikes; offset += 1) {
      const userIndex = (postIndex + offset + 1) % users.length;
      const user = userMap.get(users[userIndex].username);

      if (user.id === post.authorId) {
        continue;
      }

      await prisma.like.create({
        data: {
          postId: post.id,
          userId: user.id,
        },
      });
    }
  }

  console.log('Created likes.');

  /*
   * Clarke follows most of the seeded users.
   *
   * A few users are intentionally left unfollowed so the
   * Discover page still demonstrates the Follow button.
   */
  const usersClarkeFollows = [
    'bellamyblake',
    'ravenreyes',
    'octaviablake',
    'murphylives',
    'lincolngreen',
    'emilycarter',
    'alexmorgan',
    'noraellis',
    'danielpark',
    'mayachen',
    'ethanross',
  ];

  for (const username of usersClarkeFollows) {
    const recipient = userMap.get(username);

    await prisma.follow.create({
      data: {
        requesterId: demoUser.id,
        recipientId: recipient.id,
        status: 'ACCEPTED',
      },
    });
  }

  /*
   * A few people follow Clarke as well.
   */
  const clarkeFollowers = [
    'bellamyblake',
    'ravenreyes',
    'octaviablake',
    'murphylives',
    'noraellis',
  ];

  for (const username of clarkeFollowers) {
    const requester = userMap.get(username);

    await prisma.follow.create({
      data: {
        requesterId: requester.id,
        recipientId: demoUser.id,
        status: 'ACCEPTED',
      },
    });
  }

  /*
   * Pending requests:
   *
   * Clarke has one incoming request and one outgoing request.
   * This gives the demo Follow Requests page something to show.
   */
  await prisma.follow.create({
    data: {
      requesterId: userMap.get('jordanlee').id,
      recipientId: demoUser.id,
      status: 'PENDING',
    },
  });

  await prisma.follow.create({
    data: {
      requesterId: userMap.get('sarahstone').id,
      recipientId: demoUser.id,
      status: 'PENDING',
    },
  });

  /*
   * A couple of declined relationships demonstrate that historical
   * follow records can exist without appearing as active follows.
   */
  await prisma.follow.create({
    data: {
      requesterId: userMap.get('noahwilliams').id,
      recipientId: demoUser.id,
      status: 'DECLINED',
    },
  });

  await prisma.follow.create({
    data: {
      requesterId: userMap.get('sarahstone').id,
      recipientId: userMap.get('noahwilliams').id,
      status: 'DECLINED',
    },
  });

  console.log('Created follow relationships.');

  console.log('');
  console.log('======================================');
  console.log('Demo database seeded successfully.');
  console.log('======================================');
  console.log(`Demo username: ${demoUser.username}`);
  console.log(`Demo email:    ${demoUser.email}`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  console.log('');
  console.log(`Users:    ${users.length}`);
  console.log(`Posts:    ${posts.length}`);
  console.log(`Comments: ${commentData.length}`);
  console.log('======================================');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
