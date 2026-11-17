import type {
  AssessmentDefinition,
  AssessmentIntent,
  AssessmentQuestion,
  LearningPathDefinition,
  LessonDefinition,
  TopicDefinition,
} from '@algoflow/contracts';

interface ChoiceSeed {
  prompt: string;
  correct: string;
  distractors: [string, string, string];
  explanation: string;
}

interface LessonMasterySeed {
  recall: ChoiceSeed;
  application: ChoiceSeed;
  debugging: ChoiceSeed;
  teachBack: {
    prompt: string;
    correct: [string, string, string];
    distractor: string;
    explanation: string;
  };
  transfer: ChoiceSeed & { intent: 'exam' | 'interview' };
}

const seeds: Record<string, LessonMasterySeed> = {
  'complexity-basics-js': {
    recall: {
      prompt: 'Which model grows fastest as n becomes large?',
      correct: 'O(n²)',
      distractors: ['O(1)', 'O(log n)', 'O(n)'],
      explanation: 'Quadratic work grows with the square of the input.',
    },
    application: {
      prompt:
        'A loop examines every ordered pair in a 100-item array. What is the closest operation count?',
      correct: '10,000',
      distractors: ['100', '200', '1,000'],
      explanation: 'A pairwise nested scan models n × n = 10,000 operations.',
    },
    debugging: {
      prompt:
        'Why is “both versions are fast at n = 10” weak complexity evidence?',
      correct: 'Small inputs can hide different growth rates',
      distractors: [
        'Big-O measures only memory',
        'All loops are constant time',
        'Benchmarks replace input analysis',
      ],
      explanation: 'Growth-rate differences dominate only as the input scales.',
    },
    teachBack: {
      prompt: 'Select the claims that belong in a sound Big-O explanation.',
      correct: [
        'Name the input variable',
        'Describe how work grows',
        'Ignore bounded constant factors',
      ],
      distractor: 'Promise an exact runtime in milliseconds',
      explanation:
        'Big-O describes asymptotic growth for a declared input model, not an exact clock time.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'For large input, which improvement changes the growth class rather than a constant?',
      correct: 'Replace a nested scan with sorting plus one scan',
      distractors: [
        'Rename loop variables',
        'Use a faster laptop',
        'Move one condition outside the loop',
      ],
      explanation: 'O(n log n) changes the asymptotic model relative to O(n²).',
    },
  },
  'bubble-sort-js': {
    recall: {
      prompt: 'What invariant grows after each completed Bubble Sort pass?',
      correct: 'A sorted suffix at the right boundary',
      distractors: [
        'A sorted prefix only',
        'A heap at the root',
        'A queue of pivots',
      ],
      explanation:
        'Each pass moves the largest remaining value into the sorted suffix.',
    },
    application: {
      prompt: 'For [3, 1, 2], what is the first deterministic transition?',
      correct: 'Compare 3 and 1, then swap them',
      distractors: [
        'Compare 1 and 2, then stop',
        'Move 2 to index 0',
        'Reverse the entire array',
      ],
      explanation:
        'Bubble Sort begins with the leftmost adjacent pair and removes that inversion.',
    },
    debugging: {
      prompt:
        'An optimized implementation stops after a pass with no swaps. Which bug breaks that rule?',
      correct: 'The swapped flag is not reset before each pass',
      distractors: [
        'The array uses numbers',
        'The loop starts at index 0',
        'The comparison is adjacent',
      ],
      explanation: 'The flag must represent only the current pass.',
    },
    teachBack: {
      prompt: 'Select the essential parts of a Bubble Sort explanation.',
      correct: [
        'Compare adjacent values',
        'Swap only inversions',
        'Shrink the unsorted boundary after a pass',
      ],
      distractor: 'Choose a random pivot',
      explanation:
        'Adjacent inversion removal and the sorted suffix define the algorithm.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'When does the common optimized Bubble Sort reach its best case?',
      correct: 'The first pass performs no swaps',
      distractors: [
        'Every pair swaps',
        'The pivot is median',
        'The array length is odd',
      ],
      explanation:
        'A no-swap pass proves the array is already sorted, allowing O(n) best-case work.',
    },
  },
  'two-pointers-js': {
    recall: {
      prompt:
        'What property usually justifies discarding pairs in the classic two-sum two-pointer scan?',
      correct: 'The values are sorted',
      distractors: [
        'The values are random',
        'The array is immutable',
        'The target is even',
      ],
      explanation:
        'Sorted order makes pointer movement monotonic and discarded regions safe.',
    },
    application: {
      prompt:
        'In a sorted pair-sum scan, the current sum is below target. Which pointer moves?',
      correct: 'Move the left pointer right',
      distractors: [
        'Move the right pointer right',
        'Move both outward',
        'Reset both pointers',
      ],
      explanation: 'Only increasing the smaller value can raise the sum.',
    },
    debugging: {
      prompt:
        'A two-pointer pair-sum solution fails on an unsorted array. What assumption was violated?',
      correct: 'Pointer movement no longer discards a monotonic region',
      distractors: [
        'Arrays cannot contain integers',
        'Two pointers require recursion',
        'The target must be zero',
      ],
      explanation:
        'Without order, moving either boundary does not safely rule out candidates.',
    },
    teachBack: {
      prompt: 'Select the claims that explain the two-pointer invariant.',
      correct: [
        'Each move follows ordered evidence',
        'Discarded pairs cannot satisfy the target',
        'The active interval only shrinks',
      ],
      distractor: 'Every move revisits prior pairs',
      explanation:
        'Monotonic movement turns a quadratic search space into a linear scan.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'Which unfamiliar problem most directly admits the same inward-pointer model?',
      correct:
        'Find whether a sorted array has a pair with a target difference',
      distractors: [
        'Traverse a binary tree by level',
        'Schedule tasks by priority',
        'Find strongly connected components',
      ],
      explanation: 'A monotonic comparison can decide which boundary to move.',
    },
  },
  'sliding-window-ts': {
    recall: {
      prompt: 'What makes a sliding window avoid recomputing every subarray?',
      correct: 'It updates state only for entering and leaving values',
      distractors: [
        'It sorts each window',
        'It uses recursion',
        'It copies the full array',
      ],
      explanation:
        'Incremental boundary updates reuse the previous window state.',
    },
    application: {
      prompt:
        'A length-3 sum window moves right by one. What update is required?',
      correct: 'Subtract the old left value and add the new right value',
      distractors: [
        'Add all three values again',
        'Reverse the window',
        'Clear the running sum',
      ],
      explanation: 'Only one value leaves and one enters.',
    },
    debugging: {
      prompt:
        'A longest-unique-substring window never moves its left edge after a duplicate. What fails?',
      correct: 'The window invariant remains violated',
      distractors: [
        'The string becomes sorted',
        'The right edge must move backward',
        'The complexity becomes constant',
      ],
      explanation: 'The left edge must shrink until uniqueness is restored.',
    },
    teachBack: {
      prompt: 'Select the pieces of a reusable sliding-window explanation.',
      correct: [
        'Define the valid window invariant',
        'Update state at both boundaries',
        'Record the best valid state',
      ],
      distractor: 'Enumerate every subarray from scratch',
      explanation:
        'Window validity, boundary updates, and best-state tracking form the pattern.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'Which condition signals a variable-size window should shrink?',
      correct: 'Its invariant is violated',
      distractors: [
        'The array length is even',
        'The current answer improved',
        'The right pointer is zero',
      ],
      explanation:
        'The window contracts only until the required validity condition is restored.',
    },
  },
  'bfs-grid-go': {
    recall: {
      prompt: 'Which frontier discipline gives BFS layer order?',
      correct: 'FIFO queue',
      distractors: ['LIFO stack', 'Priority heap', 'Random set'],
      explanation: 'Oldest discovered nodes are processed first.',
    },
    application: {
      prompt:
        'Which traversal should find the fewest moves in an unweighted grid?',
      correct: 'BFS from the start cell',
      distractors: [
        'Arbitrary DFS',
        'Insertion sort',
        'Binary search on cells',
      ],
      explanation: 'BFS reaches nodes in nondecreasing hop distance.',
    },
    debugging: {
      prompt:
        'Why can marking visited only when dequeuing waste substantial work?',
      correct: 'The same node can be enqueued by several parents',
      distractors: [
        'Queues reject integers',
        'The graph becomes directed',
        'Distances become negative',
      ],
      explanation: 'Marking on discovery prevents duplicate frontier entries.',
    },
    teachBack: {
      prompt: 'Select the claims required to explain BFS correctness.',
      correct: [
        'Use a FIFO frontier',
        'Mark nodes when discovered',
        'Process one distance layer before the next',
      ],
      distractor: 'Always follow the newest branch first',
      explanation:
        'FIFO order and one-time discovery establish shortest unweighted distances.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'How do you solve shortest distance from any hospital to every cell?',
      correct: 'Start one BFS with all hospitals in the initial queue',
      distractors: [
        'Run DFS from the farthest cell',
        'Sort cells by coordinates',
        'Use one stack per hospital',
      ],
      explanation:
        'Multi-source BFS expands all distance-zero sources together.',
    },
  },
  'dfs-grid-go': {
    recall: {
      prompt: 'Which frontier behavior makes DFS follow one branch deeply?',
      correct: 'LIFO stack or recursion',
      distractors: ['FIFO queue', 'Round-robin queue', 'Sorted map'],
      explanation: 'The newest unfinished branch is resumed first.',
    },
    application: {
      prompt: 'Which task naturally uses DFS backtracking?',
      correct: 'Explore every connected region in a maze',
      distractors: [
        'Find shortest unweighted distance first',
        'Serve requests in arrival order',
        'Maintain a rolling average',
      ],
      explanation:
        'DFS explores a branch, backtracks, and continues until the component is exhausted.',
    },
    debugging: {
      prompt:
        'A recursive DFS over a cyclic graph never terminates. What is missing?',
      correct: 'A visited check before recursive expansion',
      distractors: ['A sorted suffix', 'A cache TTL', 'A second queue'],
      explanation:
        'Visited state prevents a cycle from re-entering the same nodes forever.',
    },
    teachBack: {
      prompt: 'Select the core DFS explanation claims.',
      correct: [
        'Choose one frontier branch',
        'Record visited nodes',
        'Backtrack when no unvisited neighbor remains',
      ],
      distractor: 'Finish every distance layer first',
      explanation: 'Depth choice, visited state, and backtracking define DFS.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'Which additional state lets DFS detect a directed cycle?',
      correct: 'A recursion-stack or active-path marker',
      distractors: [
        'Only a global node count',
        'A FIFO distance table',
        'A sorted array copy',
      ],
      explanation:
        'An edge to a node still on the active recursion path is a back edge.',
    },
  },
  'software-systems-map': {
    recall: {
      prompt: 'What best defines a useful software-system boundary?',
      correct: 'A responsibility with an explicit contract',
      distractors: [
        'A different background color',
        'A long function',
        'A shared global variable',
      ],
      explanation: 'Boundaries separate responsibility and expose a contract.',
    },
    application: {
      prompt:
        'A user action returns 500 after a write. Which first trace is most useful?',
      correct:
        'Follow the request across interface, service, data, and telemetry',
      distractors: [
        'Change the UI font',
        'Restart every dependency',
        'Read only the client log',
      ],
      explanation:
        'End-to-end evidence locates the responsibility that failed.',
    },
    debugging: {
      prompt:
        'Why is a shared database table a weak implicit service contract?',
      correct: 'Consumers can bypass ownership and couple to storage details',
      distractors: [
        'Tables cannot store text',
        'Services require one process',
        'Databases remove latency',
      ],
      explanation:
        'Implicit shared schemas erase ownership and controlled evolution.',
    },
    teachBack: {
      prompt: 'Select the elements of a complete request mental model.',
      correct: [
        'User intent enters through an interface',
        'A service owns application behavior',
        'Telemetry closes the operational feedback loop',
      ],
      distractor: 'Every layer shares mutable state directly',
      explanation:
        'Contracts and evidence connect the layers without collapsing their responsibilities.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A request is slow but successful. Which evidence best narrows the boundary?',
      correct: 'A distributed trace with per-boundary latency',
      distractors: [
        'A screenshot of the page',
        'The repository star count',
        'A random database restart',
      ],
      explanation:
        'Latency attributed to spans identifies where time is spent.',
    },
  },
  'javascript-execution-model': {
    recall: {
      prompt: 'When can a queued callback enter the JavaScript call stack?',
      correct: 'After the current stack becomes empty',
      distractors: [
        'Before synchronous code',
        'Immediately when registered',
        'Only after reload',
      ],
      explanation: 'JavaScript runs the current stack to completion.',
    },
    application: {
      prompt:
        'Synchronous code schedules a timer and then logs a value. Which log occurs first?',
      correct: 'The synchronous log',
      distractors: [
        'The timer callback',
        'Both are impossible',
        'The browser chooses randomly',
      ],
      explanation:
        'The timer callback waits outside the stack until synchronous work completes.',
    },
    debugging: {
      prompt: 'Why does one long CPU loop freeze input and timers?',
      correct: 'It keeps the single call stack occupied',
      distractors: [
        'Timers delete the DOM',
        'The task queue is sorted',
        'Web APIs stop the network',
      ],
      explanation: 'Queued work cannot run while the stack is blocked.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct event-loop explanation.',
      correct: [
        'Stack work runs to completion',
        'Web APIs can finish outside the stack',
        'Queued callbacks wait for an eligible empty stack',
      ],
      distractor: 'Every callback runs at registration time',
      explanation:
        'The runtime coordinates stack, host APIs, queues, and scheduling.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'What is the safest way to keep a large CPU task responsive in the browser?',
      correct: 'Split or move the work so the stack yields',
      distractors: [
        'Add more nested callbacks synchronously',
        'Increase the timer delay only',
        'Store the loop in a global variable',
      ],
      explanation:
        'Yielding or using a worker lets the event loop process other work.',
    },
  },
  'request-to-cdn': {
    recall: {
      prompt: 'What does a CDN edge do on a cache miss?',
      correct: 'Fetch from the configured origin and optionally fill cache',
      distractors: [
        'Disable DNS',
        'Make the client the origin',
        'Skip TLS permanently',
      ],
      explanation: 'The origin remains the fallback authority.',
    },
    application: {
      prompt: 'Which change most directly reduces repeat global asset latency?',
      correct: 'Cache immutable assets at nearby edges',
      distractors: [
        'Move DNS into JavaScript',
        'Disable cache keys',
        'Force every request to origin',
      ],
      explanation: 'Edge hits terminate close to users.',
    },
    debugging: {
      prompt:
        'Users receive another account’s personalized response from cache. What likely failed?',
      correct: 'The cache key or cacheability policy omitted identity context',
      distractors: [
        'The asset hash was too long',
        'The origin had one CPU',
        'DNS used UDP',
      ],
      explanation:
        'Personalized content needs isolation or must not be shared-cacheable.',
    },
    teachBack: {
      prompt: 'Select the pieces of a complete CDN request explanation.',
      correct: [
        'DNS routes toward an edge',
        'A hit terminates at the edge',
        'A miss falls back to origin and can fill cache',
      ],
      distractor: 'Every response bypasses the edge',
      explanation:
        'Routing, hit behavior, and origin fallback define the delivery path.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A deployment serves stale HTML while hashed assets are fresh. What control is most relevant?',
      correct:
        'Use a short HTML policy or explicit invalidation while keeping hashed assets immutable',
      distractors: [
        'Disable all caching forever',
        'Cache HTML for one year',
        'Remove asset hashes',
      ],
      explanation:
        'Different content classes need different freshness strategies.',
    },
  },
  'relational-data-modeling': {
    recall: {
      prompt: 'What does a foreign key enforce?',
      correct: 'Referential integrity',
      distractors: ['CSS ordering', 'Network routing', 'File compression'],
      explanation:
        'The referenced row must exist according to the declared relationship.',
    },
    application: {
      prompt:
        'How should students and courses usually model a many-to-many enrollment?',
      correct: 'An enrollment table with foreign keys to both entities',
      distractors: [
        'A comma-separated course column',
        'One global counter',
        'Duplicate every student row',
      ],
      explanation:
        'The join entity represents the relationship and its attributes.',
    },
    debugging: {
      prompt:
        'Orders reference deleted customers. Which missing database rule allowed it?',
      correct: 'An enforced foreign-key policy',
      distractors: ['A CSS reset', 'A queue consumer', 'A CDN TTL'],
      explanation:
        'A foreign key with deliberate deletion behavior prevents orphan references.',
    },
    teachBack: {
      prompt: 'Select the claims in a complete relational model explanation.',
      correct: [
        'Entities need stable identity',
        'Relationships need explicit keys',
        'Constraints reject invalid states',
      ],
      distractor: 'Application code is the only integrity boundary',
      explanation:
        'Keys and constraints make the database participate in correctness.',
    },
    transfer: {
      intent: 'exam',
      prompt: 'Where should an order line’s quantity live?',
      correct: 'On the relationship between order and product',
      distractors: [
        'Only on product',
        'Only on customer',
        'In the database name',
      ],
      explanation:
        'Quantity describes one product’s participation in one order.',
    },
  },
  'containers-and-images': {
    recall: {
      prompt: 'Which artifact is the immutable container build output?',
      correct: 'Image',
      distractors: ['Running container', 'Process ID', 'Log stream'],
      explanation: 'A container is a runtime instance created from an image.',
    },
    application: {
      prompt: 'A dependency changes. What keeps environments reproducible?',
      correct: 'Rebuild a versioned image from declared source',
      distractors: [
        'Patch each running container manually',
        'Rename the process',
        'Store the dependency in logs',
      ],
      explanation: 'The artifact must be recreated from its declaration.',
    },
    debugging: {
      prompt:
        'Why is installing a fix inside one running container a fragile repair?',
      correct: 'The change is lost on recreation and is not in the image',
      distractors: [
        'Containers cannot run processes',
        'Images require a browser',
        'Logs become immutable',
      ],
      explanation: 'Runtime mutation creates unreproducible drift.',
    },
    teachBack: {
      prompt: 'Select the claims required to explain images and containers.',
      correct: [
        'Image layers are built artifacts',
        'A container adds runtime state',
        'Recreation should restore the declared artifact',
      ],
      distractor: 'A container permanently changes its source image',
      explanation:
        'Immutable artifact and disposable runtime are separate boundaries.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'What is the main benefit of a multi-stage build?',
      correct: 'Keep build tools out of the final runtime image',
      distractors: [
        'Make containers stateful',
        'Disable layer caching',
        'Run several kernels in one container',
      ],
      explanation:
        'Separating build and runtime stages reduces size and attack surface.',
    },
  },
  'vectors-for-machine-learning': {
    recall: {
      prompt: 'What does a feature vector represent?',
      correct: 'One example as numeric coordinates',
      distractors: [
        'Only a database table',
        'A deployment region',
        'A network socket',
      ],
      explanation:
        'Features become coordinates algorithms can transform and compare.',
    },
    application: {
      prompt: 'When is cosine similarity preferable to raw Euclidean distance?',
      correct: 'Direction matters more than vector magnitude',
      distractors: [
        'All features are text labels',
        'There is no numeric representation',
        'Only database latency matters',
      ],
      explanation:
        'Cosine similarity compares orientation after accounting for magnitude.',
    },
    debugging: {
      prompt:
        'Income dominates age in a distance model only because its numbers are larger. What is missing?',
      correct: 'Feature scaling or normalization',
      distractors: [
        'A CDN cache',
        'A recursive traversal',
        'A second primary key',
      ],
      explanation: 'Scale must reflect meaning rather than units alone.',
    },
    teachBack: {
      prompt: 'Select the claims in a complete vector-model explanation.',
      correct: [
        'Features define coordinates',
        'Transformations change representation',
        'Similarity depends on the chosen geometry',
      ],
      distractor:
        'Vector distance is meaningful without any feature assumptions',
      explanation:
        'Representation and metric choices determine what closeness means.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'Two embedding vectors point in the same direction but have different magnitude. What is their cosine similarity near?',
      correct: '1',
      distractors: ['0', '-1', 'Their dimensionality'],
      explanation: 'Same-direction vectors have cosine near one.',
    },
  },
  'prompt-to-agent-loop': {
    recall: {
      prompt: 'Why must a tool result return to an agent loop?',
      correct: 'It becomes evidence for the next decision',
      distractors: [
        'It makes grading random',
        'It hides permissions',
        'It replaces the goal',
      ],
      explanation: 'Observations ground subsequent decisions and evaluation.',
    },
    application: {
      prompt: 'Which control best bounds an agent that can modify files?',
      correct:
        'Explicit tool permissions plus validation and a stopping condition',
      distractors: [
        'A longer persona prompt only',
        'Unlimited retries',
        'Hidden tool output',
      ],
      explanation: 'Bounded authority and evaluation constrain action.',
    },
    debugging: {
      prompt:
        'An agent repeats the same failed tool call indefinitely. What loop state is missing?',
      correct: 'Failure observation, retry budget, or stop evaluation',
      distractors: [
        'A larger font',
        'A sorted suffix',
        'A database foreign key only',
      ],
      explanation:
        'The loop must incorporate failure evidence and termination policy.',
    },
    teachBack: {
      prompt: 'Select the components of a bounded agent loop.',
      correct: [
        'A goal constrains decisions',
        'Tool observations update state',
        'Evaluation decides continue, recover, or stop',
      ],
      distractor: 'Tool calls apply without permission or evidence',
      explanation:
        'Goal, action, observation, and evaluation close the autonomy loop.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'Which evidence most directly evaluates an agent workflow?',
      correct:
        'Deterministic task outcomes and traced decisions across representative cases',
      distractors: [
        'One impressive transcript',
        'Model confidence alone',
        'The longest possible prompt',
      ],
      explanation:
        'Outcome evals and traces reveal both success and unsafe paths.',
    },
  },
  'active-technical-reading': {
    recall: {
      prompt: 'Which action most directly tests understanding after reading?',
      correct: 'Recall the model without looking',
      distractors: [
        'Highlight every sentence',
        'Copy the chapter',
        'Read faster',
      ],
      explanation: 'Retrieval exposes gaps and strengthens memory.',
    },
    application: {
      prompt: 'What should a chapter heading become before deep reading?',
      correct: 'A question you expect the section to answer',
      distractors: [
        'A color code only',
        'A copied paragraph',
        'A reason to skip examples',
      ],
      explanation: 'Questions create a retrieval target and guide attention.',
    },
    debugging: {
      prompt:
        'Notes feel familiar but cannot be explained a week later. What practice was likely missing?',
      correct: 'Closed-book retrieval and spaced review',
      distractors: [
        'More passive highlighting',
        'A larger document',
        'Shorter headings',
      ],
      explanation:
        'Recognition during rereading is weaker evidence than retrieval.',
    },
    teachBack: {
      prompt: 'Select the stages of an evidence-producing reading loop.',
      correct: [
        'Preview and question',
        'Recall without the source',
        'Apply the model to a new case',
      ],
      distractor: 'Judge mastery by pages completed',
      explanation: 'Reading becomes learning through retrieval and transfer.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'How should you approach a difficult unfamiliar technical book?',
      correct:
        'Build a question map, read selectively, retrieve, and test with small applications',
      distractors: [
        'Read linearly without stopping',
        'Copy every example verbatim',
        'Wait for complete understanding before asking questions',
      ],
      explanation:
        'A question-driven loop creates inspectable understanding and progress.',
    },
  },
  'staff-role-and-impact': {
    recall: {
      prompt: 'What most clearly demonstrates Staff-level impact?',
      correct:
        'A durable improvement across an important organizational boundary',
      distractors: [
        'Writing the most code',
        'Approving every decision',
        'Owning the most meetings',
      ],
      explanation:
        'Staff scope is consequential, durable leverage rather than activity.',
    },
    application: {
      prompt: 'Which project is the strongest Staff candidate?',
      correct:
        'A repeated cross-team reliability failure tied to a material business constraint',
      distractors: [
        'A cosmetic refactor with no user impact',
        'Taking every team task personally',
        'Replacing a tool because it is fashionable',
      ],
      explanation:
        'Problem selection begins with consequential context and leverage.',
    },
    debugging: {
      prompt:
        'A Staff engineer personally rescues every incident. Why is this not durable leverage?',
      correct: 'The organization remains dependent on one person',
      distractors: [
        'Incidents never need expertise',
        'Staff engineers cannot code',
        'Reliability has no business impact',
      ],
      explanation:
        'Durable systems, ownership, and learning must outlast the intervention.',
    },
    teachBack: {
      prompt: 'Select the claims in a complete Staff impact explanation.',
      correct: [
        'Start from business context',
        'Select a leveraged technical problem',
        'Leave durable capability across boundaries',
      ],
      distractor: 'Measure scope by personal task count',
      explanation:
        'Judgment and organizational leverage connect context to durable impact.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'How should you answer “tell me about Staff-level influence without authority”?',
      correct:
        'Explain context, stakeholders, trade-offs, alignment mechanism, outcome, and durable follow-through',
      distractors: [
        'List technologies only',
        'Claim everyone agreed immediately',
        'Describe only your individual code',
      ],
      explanation:
        'The evidence must show judgment, alignment, and sustained impact.',
    },
  },
  'technical-strategy': {
    recall: {
      prompt: 'What connects a strategy diagnosis to execution?',
      correct: 'A guiding policy and coherent actions',
      distractors: [
        'A longer project list',
        'A fixed vendor',
        'A quarterly presentation',
      ],
      explanation: 'Policy focuses mutually reinforcing choices.',
    },
    application: {
      prompt:
        'Several teams duplicate event delivery and lose messages. What comes first in strategy?',
      correct:
        'Diagnose the shared constraint and why current behavior persists',
      distractors: [
        'Mandate a product immediately',
        'Create unrelated projects',
        'Choose metrics after delivery',
      ],
      explanation: 'A strategy begins with a specific explanatory diagnosis.',
    },
    debugging: {
      prompt: 'A “strategy” lists 20 projects but no choices. What is absent?',
      correct: 'A guiding policy that excludes incoherent action',
      distractors: [
        'More project names',
        'A bigger slide deck',
        'A programming-language benchmark',
      ],
      explanation: 'Strategy must constrain action, not merely collect work.',
    },
    teachBack: {
      prompt: 'Select the parts of a testable technical strategy.',
      correct: [
        'A diagnosis',
        'A guiding policy with coherent actions',
        'Signals that can disprove progress',
      ],
      distractor: 'An irreversible technology choice without context',
      explanation:
        'Direction becomes testable when choices connect to measurable signals.',
    },
    transfer: {
      intent: 'interview',
      prompt: 'What strongest evidence shows a technical strategy worked?',
      correct:
        'Target constraints improved and teams independently made aligned decisions',
      distractors: [
        'The document was long',
        'Every project used one language',
        'No assumptions were revisited',
      ],
      explanation:
        'Strategy creates outcomes and a reusable decision framework.',
    },
  },
  'leading-cross-team-change': {
    recall: {
      prompt: 'What makes a high-risk migration safer?',
      correct: 'Explicit validation gates and a tested rollback path',
      distractors: [
        'One irreversible cutover',
        'Implicit ownership',
        'Measure only after completion',
      ],
      explanation:
        'Incremental validation and rollback bound technical and organizational risk.',
    },
    application: {
      prompt: 'Before moving database authority, which evidence is strongest?',
      correct:
        'Reconciled data, production shadow traffic, ownership, and exercised rollback',
      distractors: [
        'A successful local demo only',
        'An unreviewed deadline',
        'A new service name',
      ],
      explanation:
        'Cutover needs evidence about correctness, operation, and recovery.',
    },
    debugging: {
      prompt:
        'A cutover fails and no team knows who can revert traffic. What design gap is this?',
      correct: 'Rollback ownership and control were not explicit',
      distractors: [
        'The UI needs more color',
        'The schema has too many vowels',
        'The queue is FIFO',
      ],
      explanation:
        'Migration safety is sociotechnical: controls need owners and rehearsed decisions.',
    },
    teachBack: {
      prompt: 'Select the stages of a safe cross-team change.',
      correct: [
        'Align on the shared problem and owners',
        'Deliver through validation gates',
        'Cut over reversibly and capture learning',
      ],
      distractor: 'Hide risk until the final switch',
      explanation:
        'Shared ownership, staged evidence, and reversibility form the change system.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A deadline pressures you to skip the final migration gate. What is the Staff response?',
      correct:
        'Quantify the unbounded risk, propose the smallest safe gate, and preserve rollback authority',
      distractors: [
        'Proceed silently',
        'Cancel all future migration work',
        'Delegate the decision without evidence',
      ],
      explanation:
        'Staff judgment makes risk and alternatives explicit while preserving safe progress.',
    },
  },
  'javascript-closures-scope': {
    recall: {
      prompt: 'What does a closure capture from its enclosing scope?',
      correct: 'Live bindings, not copies of their values',
      distractors: [
        'A snapshot of every value at creation time',
        'Only global variables',
        'The call stack of its caller',
      ],
      explanation:
        'A closure keeps references to the bindings it uses, so later writes are visible to it.',
    },
    application: {
      prompt:
        'createCounter() returns increment and current over a local count. You call a.increment() twice and create b = createCounter(10). What do a.current() and b.current() return?',
      correct: '2 and 10',
      distractors: ['2 and 12', '12 and 12', '0 and 10'],
      explanation:
        'Each createCounter call creates a separate count binding, so the two counters never share state.',
    },
    debugging: {
      prompt:
        'A loop written with var i schedules three setTimeout callbacks that log i, and every callback logs 3. What is the cause?',
      correct: 'All callbacks close over one function-scoped binding',
      distractors: [
        'setTimeout copies the value too late',
        'The event loop reorders the callbacks',
        'Arrow functions cannot read loop variables',
      ],
      explanation:
        'var creates one binding for the whole loop; let creates a fresh binding per iteration.',
    },
    teachBack: {
      prompt: 'Select the claims that belong in a correct scope explanation.',
      correct: [
        'Name lookup is fixed by where code is written',
        'Lookup walks outward through enclosing scopes',
        'A referenced binding stays alive while a closure can reach it',
      ],
      distractor: 'A function sees the variables of whoever calls it',
      explanation:
        'JavaScript is lexically scoped: the source structure, not the call site, decides which binding a name refers to.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A rate limiter module must track request counts per client, but no other module may read or reset them. Which design applies the lesson most directly?',
      correct:
        'A factory that keeps a Map in a closure and returns only check and record functions',
      distractors: [
        'Export the Map so callers can inspect it',
        'Store the counts on globalThis',
        'Pass the counts as an argument to every call',
      ],
      explanation:
        'Closing over private state exposes behavior through an interface while making the state itself unreachable.',
    },
  },
  'javascript-async-patterns': {
    recall: {
      prompt: 'What does an async function always return?',
      correct: 'A promise',
      distractors: [
        'The awaited value directly',
        'undefined until it finishes',
        'A callback function',
      ],
      explanation:
        'A returned value fulfills the promise and a thrown error rejects it.',
    },
    application: {
      prompt:
        'Three independent requests take 100 ms, 200 ms, and 300 ms. About how long does await Promise.all over all three take compared with awaiting them one by one in a loop?',
      correct: 'About 300 ms instead of about 600 ms',
      distractors: [
        'About 600 ms in both cases',
        'About 100 ms instead of about 300 ms',
        'About 300 ms in both cases',
      ],
      explanation:
        'Concurrent requests finish near the slowest one; sequential awaits add every duration together.',
    },
    debugging: {
      prompt:
        'A timeout implemented with Promise.race stops waiting, but the server still receives and processes every slow request. Why?',
      correct: 'Racing a timer stops waiting but does not cancel the request',
      distractors: [
        'Promise.race retries the losing promise',
        'The timer runs before the request starts',
        'fetch ignores every rejection',
      ],
      explanation:
        'Only a signal passed to the operation, such as an AbortSignal, makes the underlying work stop.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct explanation of async control.',
      correct: [
        'await pauses only the current async function',
        'Promise.all rejects on the first rejection',
        'An AbortSignal must be passed to the work it should cancel',
      ],
      distractor: 'await blocks the whole thread until the promise settles',
      explanation:
        'Continuations resume as microtasks, combinators encode a failure policy, and cancellation is cooperative.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'A dashboard loads five independent widgets and must show every widget that succeeded even if some fail. Which approach fits?',
      correct:
        'Promise.allSettled, then render fulfilled results and mark rejected ones',
      distractors: [
        'Promise.all with one catch for the whole batch',
        'Promise.race over the five requests',
        'Await each widget in sequence and stop at the first error',
      ],
      explanation:
        'allSettled reports every outcome, so partial failure does not discard successful results.',
    },
  },
  'typescript-types-narrowing': {
    recall: {
      prompt:
        'What makes a discriminated union narrowable with a single check?',
      correct: 'Every member has the same literal field with a distinct value',
      distractors: [
        'Every member is a class',
        'Every member has optional fields',
        'The union has exactly two members',
      ],
      explanation:
        'Checking the shared literal discriminant tells TypeScript exactly which member you hold.',
    },
    application: {
      prompt:
        'value has type string | number[] | null. After if (value === null) return; and if (typeof value === "string") return;, what is the type of value?',
      correct: 'number[]',
      distractors: ['string | number[]', 'unknown', 'never'],
      explanation:
        'Each check removes the members it ruled out, leaving only number[].',
    },
    debugging: {
      prompt:
        'A teammate adds a "cancelled" status to a Result union and the build fails at assertNever(result). What should they do?',
      correct: 'Add a case that handles the new status',
      distractors: [
        'Cast result to never',
        'Delete the default branch',
        'Change assertNever to accept unknown',
      ],
      explanation:
        'The error is the exhaustive check working: it points at the switch that does not handle the new member yet.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct narrowing explanation.',
      correct: [
        'typeof, in, and equality checks narrow a union',
        'Control flow decides the type at each line',
        'The leftover after every case is never',
      ],
      distractor: 'A type annotation validates data at runtime',
      explanation:
        'Narrowing is compile-time control-flow analysis; runtime data still needs runtime checks.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A payment webhook can be charge.succeeded, charge.failed, or refund.created, each with different fields. Which model lets the compiler catch an unhandled event type?',
      correct:
        'A union discriminated by the event type field, switched with an assertNever default',
      distractors: [
        'One interface with every field optional',
        'A Record<string, unknown> checked with if statements',
        'Separate any-typed handlers chosen by a string map',
      ],
      explanation:
        'A discriminant gives each branch its exact fields, and the never default fails compilation when a new event is added.',
    },
  },
  'typescript-generics': {
    recall: {
      prompt:
        'What does T extends { length: number } guarantee inside a generic function?',
      correct: 'Values of type T have at least a numeric length',
      distractors: [
        'T is exactly a string',
        'T is an array of numbers',
        'T has no other properties',
      ],
      explanation:
        'A constraint states the minimum shape; callers may pass any type that has it.',
    },
    application: {
      prompt:
        'getProperty<T, K extends keyof T>(obj: T, key: K): T[K] is called with ({ id: 7, name: "Ada" }, "name"). What is the return type?',
      correct: 'string',
      distractors: ['number', 'string | number', 'unknown'],
      explanation:
        'K is inferred as "name", so the indexed access T[K] resolves to that property type.',
    },
    debugging: {
      prompt:
        'A helper typed as function first(items: any[]): any lets first(users).nmae compile and then crash. What fixes the cause?',
      correct: 'Make it generic: first<T>(items: T[]): T | undefined',
      distractors: [
        'Return unknown and cast at every call site',
        'Add a comment describing the element type',
        'Wrap the call in try and catch',
      ],
      explanation:
        'A type parameter links the element type to the result, so the misspelled property becomes a compile error.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct generics explanation.',
      correct: [
        'A type parameter connects positions that must agree',
        'Constraints limit what the body may assume',
        'keyof T produces the union of T keys',
      ],
      distractor: 'Generics make values change type at runtime',
      explanation:
        'Generics are compile-time relationships; they are erased and never change runtime values.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'An update endpoint should accept any subset of a Settings type, but only its declared keys. Which type expresses that?',
      correct: 'Partial<Settings>',
      distractors: [
        'Record<string, unknown>',
        'ReturnType<Settings>',
        'Settings | undefined',
      ],
      explanation:
        'Partial makes every declared key optional while still rejecting keys Settings does not declare in object literals.',
    },
  },
  'negative-space-assertions': {
    recall: {
      prompt: 'In negative-space programming, what does an assertion state?',
      correct: 'A condition that must never be violated at that point',
      distractors: [
        'A log message for operators',
        'An expected user error to display',
        'A performance hint for the compiler',
      ],
      explanation:
        'Assertions describe impossible states so the program stops the moment one appears.',
    },
    application: {
      prompt:
        'withdraw(balance, amount) must never overdraw. Which check is the precondition?',
      correct: 'Assert amount <= balance before subtracting',
      distractors: [
        'Assert the result is a number after returning',
        'Log the balance after the update',
        'Catch any error and return the old balance',
      ],
      explanation:
        'A precondition checks the caller obligation before the operation can corrupt state.',
    },
    debugging: {
      prompt:
        'A typed function amount: number stored a negative transfer that corrupted ledgers for a week. Why did the type not prevent it?',
      correct: 'Types are erased and do not constrain numeric ranges',
      distractors: [
        'The type should have been any',
        'Strict mode was enabled',
        'Negative numbers are not numbers in TypeScript',
      ],
      explanation:
        'number accepts negative values, NaN, and Infinity; value ranges need runtime assertions.',
    },
    teachBack: {
      prompt: 'Select the claims in a sound explanation of negative space.',
      correct: [
        'Validate untrusted input at the boundary',
        'Crash on a violated invariant instead of continuing',
        'Test rejected inputs as well as accepted ones',
      ],
      distractor: 'Catch assertion failures and keep processing',
      explanation:
        'Failing fast keeps the bug close to the symptom and prevents silent corruption.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'An inventory service applies stock deltas from a queue. Which addition best applies the lesson?',
      correct:
        'Assert each delta is an integer and the resulting stock never drops below zero before writing',
      distractors: [
        'Clamp negative stock to zero and continue',
        'Retry the message until the write succeeds',
        'Log a warning and apply the delta anyway',
      ],
      explanation:
        'Asserting the invariant before the write rejects the impossible state instead of persisting or hiding it.',
    },
  },
  'aspect-oriented-decorators': {
    recall: {
      prompt: 'What makes a concern cross-cutting?',
      correct: 'It repeats across many methods without changing what they mean',
      distractors: [
        'It is the core business rule of one method',
        'It only runs during tests',
        'It must be written in a separate language',
      ],
      explanation:
        'Logging, caching, retries, and timing appear everywhere but are not the method job.',
    },
    application: {
      prompt:
        'A method has @log written above @retry(3), and the first two attempts fail. How many log entries does @log produce for the call?',
      correct: 'One entry covering all attempts',
      distractors: ['Three entries', 'Two entries', 'No entries'],
      explanation:
        'Decorators apply bottom-up, so log wraps the retrying function and sees a single call.',
    },
    debugging: {
      prompt:
        'After adding @retry(3) to createPayment, some customers are charged twice. What is the cause?',
      correct: 'Retry wraps a non-idempotent operation',
      distractors: [
        'Decorators run only once per class',
        'The retry count is too low',
        'TypeScript removes decorators at runtime',
      ],
      explanation:
        'Around advice can repeat a call; only idempotent operations are safe to retry automatically.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct AOP explanation.',
      correct: [
        'A join point is where advice attaches',
        'Around advice decides whether and how the call proceeds',
        'Decorator order changes the resulting behavior',
      ],
      distractor: 'Decorators make control flow easier to see',
      explanation:
        'Aspects remove duplication at the cost of hiding control flow behind annotations.',
    },
    transfer: {
      intent: 'exam',
      prompt:
        'Twenty repository methods each start a timer, call the database, and record a duration metric. Which change applies the lesson?',
      correct:
        'A @timed method decorator that wraps each call and records its duration',
      distractors: [
        'Copy a shared timing helper call into every method',
        'Move all queries into one large method',
        'Record metrics only when a method throws',
      ],
      explanation:
        'A uniform concern repeated at many join points is a good fit for one around-advice decorator.',
    },
  },
  'nestjs-request-pipeline': {
    recall: {
      prompt: 'Which NestJS stage runs first for an incoming request?',
      correct: 'Middleware',
      distractors: ['Guards', 'Pipes', 'Exception filters'],
      explanation:
        'Middleware sees the raw request before guards, interceptors, pipes, and the handler.',
    },
    application: {
      prompt:
        'A global ValidationPipe uses whitelist and forbidNonWhitelisted. A client posts { "sku": "A1", "quantity": 2, "admin": true } to a DTO declaring only sku and quantity. What happens?',
      correct: 'The request fails with 400 Bad Request',
      distractors: [
        'The handler receives admin: true',
        'admin is silently removed and the handler runs',
        'The guard returns 403 Forbidden',
      ],
      explanation:
        'forbidNonWhitelisted rejects undeclared properties instead of stripping them.',
    },
    debugging: {
      prompt:
        'An API key guard compares a request header with process.env.API_KEY and lets every request through in a fresh environment. What is wrong?',
      correct:
        'A missing key equals a missing header, so the guard returns true',
      distractors: [
        'Guards run after the handler',
        'Guards cannot read headers',
        'The interceptor overrides the guard',
      ],
      explanation:
        'undefined === undefined is true; the guard must reject when the expected key is not configured.',
    },
    teachBack: {
      prompt: 'Select the claims in a correct pipeline explanation.',
      correct: [
        'Guards decide access before pipes run',
        'Interceptors wrap the handler before and after',
        'Filters turn thrown exceptions into responses',
      ],
      distractor: 'Pipes run after the handler returns',
      explanation:
        'Each stage is a join point with one responsibility in a fixed order.',
    },
    transfer: {
      intent: 'interview',
      prompt:
        'A team must add a correlation ID to every response, reject unauthenticated calls, and convert domain errors into a stable error shape. Where does each concern belong?',
      correct:
        'Middleware for the ID, a guard for authentication, a filter for errors',
      distractors: [
        'All three inside each controller method',
        'A pipe for the ID, middleware for errors, an interceptor for authentication',
        'A filter for the ID, a pipe for authentication, a guard for errors',
      ],
      explanation:
        'Matching each concern to its stage keeps controllers focused and makes the order predictable.',
    },
  },
};

function choice(
  lesson: LessonDefinition,
  intent: AssessmentIntent,
  seed: ChoiceSeed,
  suffix: string,
): AssessmentQuestion {
  return {
    id: `${lesson.slug}-${suffix}`,
    kind: 'multiple-choice',
    prompt: seed.prompt,
    options: [seed.correct, ...seed.distractors],
    correctAnswer: seed.correct,
    explanation: seed.explanation,
    conceptIds: [...lesson.conceptIds],
    intent,
    difficulty:
      intent === 'recall'
        ? 'foundation'
        : intent === 'application' || intent === 'teach-back'
          ? 'intermediate'
          : 'advanced',
    transferLevel:
      intent === 'exam' || intent === 'interview'
        ? 'unfamiliar'
        : intent === 'recall'
          ? 'familiar'
          : 'variant',
    weight:
      intent === 'recall' || intent === 'teach-back'
        ? 15
        : intent === 'exam' || intent === 'interview'
          ? 20
          : 25,
    remediationHref: `/lessons/${lesson.slug}`,
  };
}

export function buildLessonMasteryAssessments(
  lessons: LessonDefinition[],
): AssessmentDefinition[] {
  return lessons.map((lesson) => {
    const seed = seeds[lesson.slug];
    if (!seed) throw new Error(`Missing mastery seed for ${lesson.slug}`);
    const recallQuestion: AssessmentQuestion =
      lesson.slug === 'bfs-grid-go'
        ? {
            id: `${lesson.slug}-recall`,
            kind: 'short-answer',
            prompt: 'Name the frontier discipline that gives BFS layer order.',
            acceptedAnswers: ['queue', 'FIFO queue', 'FIFO'],
            explanation: seed.recall.explanation,
            conceptIds: [...lesson.conceptIds],
            intent: 'recall',
            difficulty: 'foundation',
            transferLevel: 'familiar',
            weight: 15,
            remediationHref: `/lessons/${lesson.slug}`,
          }
        : choice(lesson, 'recall', seed.recall, 'recall');
    const applicationQuestion: AssessmentQuestion =
      lesson.slug === 'complexity-basics-js'
        ? {
            id: `${lesson.slug}-application`,
            kind: 'numeric-range',
            prompt:
              'A nested loop examines every ordered pair in a 100-item array. Enter the modeled operation count.',
            min: 10_000,
            max: 10_000,
            unit: 'operations',
            explanation: seed.application.explanation,
            conceptIds: [...lesson.conceptIds],
            intent: 'application',
            difficulty: 'intermediate',
            transferLevel: 'variant',
            weight: 25,
            remediationHref: `/lessons/${lesson.slug}`,
          }
        : choice(lesson, 'application', seed.application, 'application');
    return {
      slug: lesson.assessmentSlug,
      version: 1,
      scope: { kind: 'lesson', slug: lesson.slug },
      mode: 'mastery',
      lessonSlug: lesson.slug,
      title: `${lesson.title} Expert Checkpoint`,
      passingScore: 80,
      requiredIntents: ['application', 'debugging', seed.transfer.intent],
      questions: [
        recallQuestion,
        applicationQuestion,
        choice(lesson, 'debugging', seed.debugging, 'debugging'),
        {
          id: `${lesson.slug}-teach-back`,
          kind: 'multiple-select',
          prompt: seed.teachBack.prompt,
          options: [...seed.teachBack.correct, seed.teachBack.distractor],
          correctAnswer: [...seed.teachBack.correct],
          explanation: seed.teachBack.explanation,
          conceptIds: [...lesson.conceptIds],
          intent: 'teach-back',
          difficulty: 'intermediate',
          transferLevel: 'variant',
          weight: 15,
          remediationHref: `/lessons/${lesson.slug}`,
        },
        choice(lesson, seed.transfer.intent, seed.transfer, 'transfer'),
      ],
    };
  });
}

function prefixedQuestion(
  question: AssessmentQuestion,
  prefix: string,
): AssessmentQuestion {
  return { ...question, id: `${prefix}-${question.id}` };
}

export function buildTopicMasteryAssessments(
  topics: TopicDefinition[],
  lessons: LessonDefinition[],
  lessonAssessments: AssessmentDefinition[],
): AssessmentDefinition[] {
  const assessmentByLesson = new Map(
    lessonAssessments.map((assessment) => [assessment.lessonSlug, assessment]),
  );
  return topics.map((topic) => {
    const topicLessons = lessons.filter(
      (lesson) => lesson.topicSlug === topic.slug,
    );
    const packs = topicLessons.map(
      (lesson) => assessmentByLesson.get(lesson.slug)!,
    );
    const candidates = packs.flatMap((assessment) => assessment.questions);
    const selected = [
      candidates.find((question) => question.intent === 'recall'),
      ...packs.map((assessment) =>
        assessment.questions.find(
          (question) => question.intent === 'application',
        ),
      ),
      candidates.find((question) => question.intent === 'debugging'),
      candidates.find((question) => question.intent === 'teach-back'),
      candidates.find(
        (question) =>
          question.intent === 'exam' || question.intent === 'interview',
      ),
    ].filter((question): question is AssessmentQuestion => Boolean(question));
    const unique = Array.from(
      new Map(selected.map((question) => [question.id, question])).values(),
    );
    for (const question of candidates)
      if (unique.length < 5 && !unique.some((item) => item.id === question.id))
        unique.push(question);
    const transferIntent = unique.some(
      (question) => question.intent === 'interview',
    )
      ? 'interview'
      : 'exam';
    return {
      slug: `${topic.slug}-topic-checkpoint`,
      version: 1,
      scope: { kind: 'topic', slug: topic.slug },
      mode: 'mastery',
      lessonSlug: topicLessons[0]?.slug,
      title: `${topic.title} Synthesis Checkpoint`,
      passingScore: 80,
      requiredIntents: ['application', 'debugging', transferIntent],
      questions: unique
        .slice(0, 7)
        .map((question) => prefixedQuestion(question, topic.slug)),
    };
  });
}

function diagnosticQuestionBase(path: LearningPathDefinition, suffix: string) {
  return {
    id: `${path.slug}-${suffix}`,
    conceptIds: [`path:${path.slug}:readiness`],
    difficulty: 'intermediate' as const,
    transferLevel: 'variant' as const,
    weight: 25,
    remediationHref: `/paths/${path.slug}`,
  };
}

export function buildPathDiagnostics(
  paths: LearningPathDefinition[],
): AssessmentDefinition[] {
  return paths.map((path, pathIndex) => {
    const otherPaths = paths.filter(
      (candidate) => candidate.slug !== path.slug,
    );
    const otherOutcomes = otherPaths
      .slice(pathIndex % Math.max(1, otherPaths.length))
      .flatMap((candidate) => candidate.outcomes)
      .slice(0, 3);
    const moduleTitles = path.modules.map((module) => module.title);
    const otherModules = otherPaths
      .flatMap((candidate) => candidate.modules.map((module) => module.title))
      .filter((title) => !moduleTitles.includes(title))
      .slice(0, 3);
    const orderedModules = moduleTitles.slice(
      0,
      Math.min(3, moduleTitles.length),
    );
    return {
      slug: `${path.slug}-diagnostic`,
      version: 1,
      scope: { kind: 'path', slug: path.slug },
      mode: 'diagnostic',
      title: `${path.title} Readiness Diagnostic`,
      passingScore: 70,
      requiredIntents: [],
      questions: [
        {
          ...diagnosticQuestionBase(path, 'outcome'),
          kind: 'multiple-choice',
          intent: 'diagnostic',
          prompt: `Which capability belongs to the ${path.title} outcome set?`,
          options: [path.outcomes[0], ...otherOutcomes],
          correctAnswer: path.outcomes[0],
          explanation: `This path explicitly develops: ${path.outcomes.join('; ')}.`,
        },
        {
          ...diagnosticQuestionBase(path, 'module'),
          kind: 'multiple-choice',
          intent: 'recall',
          prompt: `Which module belongs to the ${path.title} roadmap?`,
          options: [moduleTitles[0], ...otherModules],
          correctAnswer: moduleTitles[0],
          explanation: `${moduleTitles[0]} is part of the declared roadmap.`,
        },
        {
          ...diagnosticQuestionBase(path, 'sequence'),
          kind: 'ordering',
          intent: 'application',
          prompt:
            'Order the first roadmap stages from foundation toward transfer.',
          options: [...orderedModules],
          correctAnswer: [...orderedModules],
          explanation:
            'The roadmap order moves from prerequisites toward more independent application.',
        },
        {
          ...diagnosticQuestionBase(path, 'evidence'),
          kind: 'multiple-select',
          intent: 'interview',
          prompt: `Which evidence would demonstrate transferable ${path.title} readiness?`,
          options: [
            'Solve an unfamiliar representative problem',
            'Explain trade-offs without hidden notes',
            'Debug a failed approach and recover',
            'Only mark every roadmap title as viewed',
          ],
          correctAnswer: [
            'Solve an unfamiliar representative problem',
            'Explain trade-offs without hidden notes',
            'Debug a failed approach and recover',
          ],
          explanation:
            'Transfer, explanation, and recovery are stronger evidence than content viewing.',
        },
      ],
    };
  });
}

export function buildAssessmentCatalog(
  lessons: LessonDefinition[],
  topics: TopicDefinition[],
  paths: LearningPathDefinition[],
) {
  const lessonAssessments = buildLessonMasteryAssessments(lessons);
  const topicAssessments = buildTopicMasteryAssessments(
    topics,
    lessons,
    lessonAssessments,
  );
  const pathDiagnostics = buildPathDiagnostics(paths);
  return [...lessonAssessments, ...topicAssessments, ...pathDiagnostics];
}

function questionErrors(question: AssessmentQuestion, assessmentSlug: string) {
  const errors: string[] = [];
  const prefix = `${assessmentSlug}/${question.id}`;
  if (!question.intent || !question.difficulty || !question.transferLevel)
    errors.push(`${prefix}: missing mastery metadata`);
  if (!Number.isFinite(question.weight) || (question.weight ?? 0) <= 0)
    errors.push(`${prefix}: invalid weight`);
  if (!question.conceptIds.length)
    errors.push(`${prefix}: missing concept evidence`);
  if (question.remediationHref && !question.remediationHref.startsWith('/'))
    errors.push(`${prefix}: invalid remediation link`);
  if (question.kind === 'multiple-choice') {
    if (
      question.options.length < 2 ||
      new Set(question.options).size !== question.options.length ||
      !question.options.includes(question.correctAnswer)
    )
      errors.push(`${prefix}: invalid multiple-choice answer`);
  } else if (question.kind === 'multiple-select') {
    if (
      !question.correctAnswer.length ||
      new Set(question.correctAnswer).size !== question.correctAnswer.length ||
      question.correctAnswer.some(
        (answer) => !question.options.includes(answer),
      )
    )
      errors.push(`${prefix}: invalid multiple-select answer`);
  } else if (question.kind === 'ordering') {
    if (
      question.correctAnswer.length !== question.options.length ||
      new Set(question.correctAnswer).size !== question.correctAnswer.length ||
      question.correctAnswer.some(
        (answer) => !question.options.includes(answer),
      )
    )
      errors.push(`${prefix}: invalid ordering answer`);
  } else if (question.kind === 'short-answer') {
    if (
      !question.acceptedAnswers.length ||
      question.acceptedAnswers.some((answer) => !answer.trim())
    )
      errors.push(`${prefix}: invalid short-answer aliases`);
  } else if (question.kind === 'numeric-range' && question.min > question.max)
    errors.push(`${prefix}: reversed numeric range`);
  return errors;
}

export function validateMasteryCoverage(
  lessons: LessonDefinition[],
  topics: TopicDefinition[],
  paths: LearningPathDefinition[],
  assessments: AssessmentDefinition[],
) {
  const errors: string[] = [];
  const scopeKeys = new Set<string>();
  const questionIds = new Set<string>();
  const assessmentByScope = new Map<string, AssessmentDefinition>();
  for (const assessment of assessments) {
    if (!assessment.scope || assessment.version !== 1 || !assessment.mode)
      errors.push(`${assessment.slug}: missing versioned scope`);
    else {
      const key = `${assessment.scope.kind}:${assessment.scope.slug}`;
      if (scopeKeys.has(key))
        errors.push(`${assessment.slug}: duplicate scope ${key}`);
      scopeKeys.add(key);
      assessmentByScope.set(key, assessment);
    }
    if (!assessment.requiredIntents)
      errors.push(`${assessment.slug}: missing required intent gates`);
    for (const question of assessment.questions) {
      if (questionIds.has(question.id))
        errors.push(`${assessment.slug}: duplicate question ${question.id}`);
      questionIds.add(question.id);
      errors.push(...questionErrors(question, assessment.slug));
    }
  }

  for (const lesson of lessons) {
    const assessment = assessmentByScope.get(`lesson:${lesson.slug}`);
    if (!assessment) {
      errors.push(`${lesson.slug}: missing lesson mastery checkpoint`);
      continue;
    }
    if (assessment.questions.length < 5)
      errors.push(`${lesson.slug}: expected at least 5 mastery questions`);
    const coveredConcepts = new Set(
      assessment.questions.flatMap((question) => question.conceptIds),
    );
    for (const conceptId of lesson.conceptIds)
      if (!coveredConcepts.has(conceptId))
        errors.push(`${lesson.slug}: uncovered concept ${conceptId}`);
    const intents = new Set(
      assessment.questions.map((question) => question.intent),
    );
    for (const intent of ['recall', 'application', 'debugging'] as const)
      if (!intents.has(intent))
        errors.push(`${lesson.slug}: missing ${intent} evidence`);
    if (!intents.has('exam') && !intents.has('interview'))
      errors.push(`${lesson.slug}: missing transfer evidence`);
  }
  for (const topic of topics) {
    const assessment = assessmentByScope.get(`topic:${topic.slug}`);
    if (!assessment)
      errors.push(`${topic.slug}: missing topic synthesis checkpoint`);
    else {
      if (assessment.questions.length < 5)
        errors.push(`${topic.slug}: expected at least 5 synthesis questions`);
      const intents = new Set(
        assessment.questions.map((question) => question.intent),
      );
      if (!intents.has('application'))
        errors.push(`${topic.slug}: missing synthesis application evidence`);
      if (!intents.has('exam') && !intents.has('interview'))
        errors.push(`${topic.slug}: missing synthesis transfer evidence`);
      for (const lesson of lessons.filter(
        (candidate) => candidate.topicSlug === topic.slug,
      ))
        if (
          !assessment.questions.some((question) =>
            question.conceptIds.some((conceptId) =>
              lesson.conceptIds.includes(conceptId),
            ),
          )
        )
          errors.push(`${topic.slug}: missing lesson synthesis ${lesson.slug}`);
    }
  }
  for (const path of paths) {
    const diagnostic = assessmentByScope.get(`path:${path.slug}`);
    if (!diagnostic) errors.push(`${path.slug}: missing path diagnostic`);
    else if (
      path.modules.some((module) => module.status === 'planned') &&
      diagnostic.mode !== 'diagnostic'
    )
      errors.push(`${path.slug}: incomplete path must remain diagnostic-only`);
    if (!path.visualBlueprint || path.visualBlueprint.version !== 1)
      errors.push(`${path.slug}: missing visual mastery blueprint`);
  }
  return Array.from(new Set(errors));
}
