export interface SeedSubject {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  default_order: number;
  target_week: number;
  total_lectures: number;
  is_lecture_count_estimated: number; // 0 = confirmed, 1 = estimated
  total_dpps: number | null; // null if unknown
  topics: {
    id: string;
    name: string;
    subtopics: string[];
    lecture_count: number;
    pyq_count: number;
    difficulty_level: 'Easy' | 'Medium' | 'Hard';
    lectures: {
      lecture_num: number;
      title: string;
      duration_minutes: number;
    }[];
  }[];
  dpps?: {
    dpp_num: number;
    title: string;
    questions_count: number;
  }[];
}

export const DEFAULT_GATE_SYLLABUS: SeedSubject[] = [
  // 1. General Aptitude (Confirmed PW Data: 18 Lectures, 19 DPP)
  {
    id: 'ga',
    code: 'CS-GA',
    name: 'General Aptitude',
    icon: 'compass',
    color: '#10B981', // Emerald
    default_order: 1,
    target_week: 1,
    total_lectures: 18,
    is_lecture_count_estimated: 0, // Confirmed
    total_dpps: 19, // Confirmed
    topics: [
      {
        id: 'ga_quant',
        name: 'Quantitative Aptitude',
        subtopics: ['Percentages, Profit & Loss', 'Ratio & Proportions', 'Time & Work', 'Speed & Distance', 'Number Systems'],
        lecture_count: 8,
        pyq_count: 50,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 1, title: 'Percentages, Profit & Loss Fundamentals', duration_minutes: 80 },
          { lecture_num: 2, title: 'Ratio, Proportion & Mixture Alligation', duration_minutes: 80 },
          { lecture_num: 3, title: 'Time, Work & Pipes/Cisterns', duration_minutes: 85 },
          { lecture_num: 4, title: 'Speed, Time, Distance & Trains', duration_minutes: 85 },
          { lecture_num: 5, title: 'Number Systems & Divisibility Rules', duration_minutes: 80 },
          { lecture_num: 6, title: 'Algebra & Quadratic Equations', duration_minutes: 75 },
          { lecture_num: 7, title: 'Geometry & Mensuration', duration_minutes: 85 },
          { lecture_num: 8, title: 'Data Interpretation: Tables, Charts & Graphs', duration_minutes: 85 }
        ]
      },
      {
        id: 'ga_analytical',
        name: 'Analytical & Spatial Aptitude',
        subtopics: ['Logical Deductions & Syllogism', 'Blood Relations & Direction Sense', 'Paper Folding & Mirror Reflection', '2D/3D Rotations & Patterns'],
        lecture_count: 5,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 9, title: 'Syllogisms & Deductive Logic', duration_minutes: 80 },
          { lecture_num: 10, title: 'Direction Sense & Seating Arrangement', duration_minutes: 80 },
          { lecture_num: 11, title: 'Coding-Decoding & Series Completion', duration_minutes: 75 },
          { lecture_num: 12, title: 'Paper Folding, Mirror Images & Reflections', duration_minutes: 80 },
          { lecture_num: 13, title: 'Spatial Transformations & 3D Cube Assemblies', duration_minutes: 85 }
        ]
      },
      {
        id: 'ga_verbal',
        name: 'Verbal Aptitude',
        subtopics: ['Subject-Verb Agreement & Tenses', 'Vocabulary & Word Pairs', 'Sentence Completion', 'Reading Comprehension & Critical Inferences'],
        lecture_count: 5,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 14, title: 'English Grammar Rules & Tenses', duration_minutes: 80 },
          { lecture_num: 15, title: 'Prepositions, Articles & Modifiers', duration_minutes: 80 },
          { lecture_num: 16, title: 'Vocabulary, Antonyms, Synonyms & Phrasal Verbs', duration_minutes: 75 },
          { lecture_num: 17, title: 'Sentence Completion & Para Jumbles', duration_minutes: 80 },
          { lecture_num: 18, title: 'Reading Comprehension & Critical Inferences', duration_minutes: 85 }
        ]
      }
    ],
    dpps: Array.from({ length: 19 }, (_, i) => ({
      dpp_num: i + 1,
      title: `General Aptitude DPP - ${i + 1}`,
      questions_count: 10
    }))
  },

  // 2. Theory of Computation (Confirmed PW Data: 29 Lectures, 5 DPP)
  {
    id: 'toc',
    code: 'CS-TOC',
    name: 'Theory of Computation',
    icon: 'binary',
    color: '#EC4899', // Pink
    default_order: 2,
    target_week: 2,
    total_lectures: 29,
    is_lecture_count_estimated: 0, // Confirmed
    total_dpps: 5, // Confirmed
    topics: [
      {
        id: 'toc_regular',
        name: 'Regular Languages & Finite Automata',
        subtopics: ['DFA & NFA Design', 'NFA to DFA Conversion', 'Minimization of DFA', 'Regular Expressions', 'Pumping Lemma for Regular Languages', 'Closure & Decision Properties'],
        lecture_count: 11,
        pyq_count: 50,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 1, title: 'Alphabets, Strings, Languages & Basic Concepts', duration_minutes: 90 },
          { lecture_num: 2, title: 'DFA Design with String Length & Modulo Constraints', duration_minutes: 95 },
          { lecture_num: 3, title: 'DFA Design with Substrings, Prefix & Suffix', duration_minutes: 95 },
          { lecture_num: 4, title: 'Non-Deterministic Finite Automata (NFA) Introduction', duration_minutes: 90 },
          { lecture_num: 5, title: 'NFA with Epsilon Transitions & Equivalence', duration_minutes: 90 },
          { lecture_num: 6, title: 'Subset Construction: Converting NFA to Minimal DFA', duration_minutes: 100 },
          { lecture_num: 7, title: 'Minimization of DFA (Table Filling / Myhill-Nerode)', duration_minutes: 95 },
          { lecture_num: 8, title: 'Regular Expressions & Arden’s Theorem', duration_minutes: 95 },
          { lecture_num: 9, title: 'Conversion Between Finite Automata and Regular Expressions', duration_minutes: 90 },
          { lecture_num: 10, title: 'Pumping Lemma for Regular Languages', duration_minutes: 90 },
          { lecture_num: 11, title: 'Closure & Decision Properties of Regular Languages', duration_minutes: 100 }
        ]
      },
      {
        id: 'toc_cfl',
        name: 'Context-Free Languages & Pushdown Automata',
        subtopics: ['Context-Free Grammars', 'Parse Trees & Ambiguity', 'Simplification & CNF', 'Pushdown Automata (DPDA & NPDA)', 'CFL Properties'],
        lecture_count: 9,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: [
          { lecture_num: 12, title: 'Context-Free Grammars (CFG) & Derivations', duration_minutes: 90 },
          { lecture_num: 13, title: 'Parse Trees, Ambiguity & Inherent Ambiguity', duration_minutes: 95 },
          { lecture_num: 14, title: 'Elimination of Useless Symbols, Unit & Null Productions', duration_minutes: 90 },
          { lecture_num: 15, title: 'Chomsky Normal Form (CNF) & GNF', duration_minutes: 90 },
          { lecture_num: 16, title: 'Pushdown Automata (PDA) Principles & Configurations', duration_minutes: 95 },
          { lecture_num: 17, title: 'PDA Acceptance by Final State vs Empty Stack', duration_minutes: 95 },
          { lecture_num: 18, title: 'Deterministic PDA (DPDA) vs NPDA & DCFLs', duration_minutes: 100 },
          { lecture_num: 19, title: 'Pumping Lemma for CFLs', duration_minutes: 90 },
          { lecture_num: 20, title: 'Closure & Decision Properties of CFL & DCFL', duration_minutes: 100 }
        ]
      },
      {
        id: 'toc_turing',
        name: 'Turing Machines & Undecidability',
        subtopics: ['Turing Machine Model', 'Recursive & Recursively Enumerable', 'Halting Problem', 'Rice’s Theorem', 'Post Correspondence Problem (PCP)', 'Chomsky Hierarchy'],
        lecture_count: 9,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: [
          { lecture_num: 21, title: 'Turing Machine Mathematical Model & Instantaneous Description', duration_minutes: 95 },
          { lecture_num: 22, title: 'Design of Turing Machines for Standard Languages', duration_minutes: 100 },
          { lecture_num: 23, title: 'Turing Machine Variations: Multi-track & Multi-tape', duration_minutes: 85 },
          { lecture_num: 24, title: 'Recursive vs Recursively Enumerable (RE) Languages', duration_minutes: 95 },
          { lecture_num: 25, title: 'Church-Turing Thesis & Universal Turing Machine', duration_minutes: 85 },
          { lecture_num: 26, title: 'Halting Problem of Turing Machine & Diagonalization Proof', duration_minutes: 100 },
          { lecture_num: 27, title: 'Rice’s Theorem (Part 1 & Part 2) with GATE Problems', duration_minutes: 100 },
          { lecture_num: 28, title: 'Post Correspondence Problem (PCP) & Modified PCP', duration_minutes: 90 },
          { lecture_num: 29, title: 'Chomsky Hierarchy & Complete Decision Matrix Review', duration_minutes: 95 }
        ]
      }
    ],
    dpps: Array.from({ length: 5 }, (_, i) => ({
      dpp_num: i + 1,
      title: `Theory of Computation DPP - ${i + 1}`,
      questions_count: 10
    }))
  },

  // 3. C Programming (Confirmed PW Data: 22 Lectures, 11 DPP)
  {
    id: 'c_prog',
    code: 'CS-CP',
    name: 'C Programming',
    icon: 'terminal',
    color: '#06B6D4', // Cyan
    default_order: 3,
    target_week: 3,
    total_lectures: 22,
    is_lecture_count_estimated: 0, // Confirmed
    total_dpps: 11, // Confirmed
    topics: [
      {
        id: 'c_basics_types',
        name: 'Variables, Data Types & Operators',
        subtopics: ['Data Types & Size/Range', 'Precedence & Associativity', 'Bitwise & Logical Operators', 'Type Casting'],
        lecture_count: 6,
        pyq_count: 35,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 1, title: 'C Fundamentals, Compilation Stages & Standard IO', duration_minutes: 85 },
          { lecture_num: 2, title: 'Data Types, Formats, Storage Modifiers & Range', duration_minutes: 90 },
          { lecture_num: 3, title: 'Arithmetic, Relational & Logical Operators', duration_minutes: 85 },
          { lecture_num: 4, title: 'Increment/Decrement Side Effects & Sequence Points', duration_minutes: 95 },
          { lecture_num: 5, title: 'Bitwise Operators & Masking Tricks in GATE', duration_minutes: 90 },
          { lecture_num: 6, title: 'Conditional Operator, Precedence & Associativity Rules', duration_minutes: 90 }
        ]
      },
      {
        id: 'c_control_functions',
        name: 'Control Flow, Functions & Scope',
        subtopics: ['If-Else & Switch Case', 'Loops (For, While, Do-While)', 'Function Call by Value vs Reference', 'Static, Auto, Extern, Register'],
        lecture_count: 6,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 7, title: 'Branching: if-else, nested if & switch-case pitfalls', duration_minutes: 85 },
          { lecture_num: 8, title: 'Loops: for, while, do-while & Break/Continue', duration_minutes: 90 },
          { lecture_num: 9, title: 'Functions, Prototypes & Argument Passing', duration_minutes: 85 },
          { lecture_num: 10, title: 'Scope, Lifetime & Storage Classes (auto, static, extern)', duration_minutes: 95 },
          { lecture_num: 11, title: 'Recursion Fundamentals & Activation Records in Stack', duration_minutes: 100 },
          { lecture_num: 12, title: 'Complex Recursive Functions Output Tracing', duration_minutes: 105 }
        ]
      },
      {
        id: 'c_pointers_arrays',
        name: 'Pointers, Arrays & Dynamic Memory',
        subtopics: ['1D & 2D Array Memory Mapping', 'Pointer Arithmetic', 'Pointers to Pointers & Functions', 'Strings & Dynamic Memory Allocation'],
        lecture_count: 6,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: [
          { lecture_num: 13, title: 'Pointers Concept, De-referencing & Address Arithmetic', duration_minutes: 95 },
          { lecture_num: 14, title: '1D Arrays and Pointer Equivalence (*(arr+i))', duration_minutes: 90 },
          { lecture_num: 15, title: '2D Arrays, Row/Column Major Address Calculations', duration_minutes: 100 },
          { lecture_num: 16, title: 'Array of Pointers vs Pointer to an Array', duration_minutes: 95 },
          { lecture_num: 17, title: 'Strings, String Manipulation Library & Pitfalls', duration_minutes: 90 },
          { lecture_num: 18, title: 'Function Pointers & Dynamic Memory (malloc, calloc, free)', duration_minutes: 95 }
        ]
      },
      {
        id: 'c_structures_macros',
        name: 'Structures, Unions & Preprocessors',
        subtopics: ['Structures & Alignment/Padding', 'Self-Referential Structures', 'Unions', 'Preprocessors & Macros'],
        lecture_count: 4,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 19, title: 'Structure Syntax, Member Access & Structure Padding', duration_minutes: 95 },
          { lecture_num: 20, title: 'Self-Referential Structures & Linked List Building Blocks', duration_minutes: 90 },
          { lecture_num: 21, title: 'Unions & Bit-Fields Memory Layout', duration_minutes: 85 },
          { lecture_num: 22, title: 'Preprocessor Directives (#define, Macros, Conditional Compilation)', duration_minutes: 85 }
        ]
      }
    ],
    dpps: Array.from({ length: 11 }, (_, i) => ({
      dpp_num: i + 1,
      title: `C Programming DPP - ${i + 1}`,
      questions_count: 10
    }))
  },

  // 4. Discrete Mathematics (Confirmed PW Data: 48 Lectures, 6 DPP)
  {
    id: 'dm',
    code: 'CS-DM',
    name: 'Discrete Mathematics',
    icon: 'git-fork',
    color: '#F59E0B', // Amber
    default_order: 4,
    target_week: 4,
    total_lectures: 48,
    is_lecture_count_estimated: 0, // Confirmed
    total_dpps: 6, // Confirmed
    topics: [
      {
        id: 'dm_logic',
        name: 'Mathematical Logic & Predicates',
        subtopics: ['Propositional Logic & Connectives', 'Truth Tables & Equivalences', 'First Order Logic & Quantifiers', 'Rules of Inference'],
        lecture_count: 12,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 1, title: 'Propositions & Logical Connectives', duration_minutes: 90 },
          { lecture_num: 2, title: 'Truth Tables, Tautology, Contradiction & Contingency', duration_minutes: 90 },
          { lecture_num: 3, title: 'Logical Equivalences & Laws of Logic', duration_minutes: 95 },
          { lecture_num: 4, title: 'Normal Forms: DNF, CNF & Duals', duration_minutes: 95 },
          { lecture_num: 5, title: 'Functionally Complete Sets of Connectives', duration_minutes: 90 },
          { lecture_num: 6, title: 'Predicate Logic: Universal & Existential Quantifiers', duration_minutes: 95 },
          { lecture_num: 7, title: 'Nested Quantifiers & Translation of English Statements', duration_minutes: 100 },
          { lecture_num: 8, title: 'Validity and Satisfiability of Predicates', duration_minutes: 95 },
          { lecture_num: 9, title: 'Rules of Inference in Propositional Logic', duration_minutes: 90 },
          { lecture_num: 10, title: 'Rules of Inference in Predicate Logic', duration_minutes: 90 },
          { lecture_num: 11, title: 'Resolution Refutation in Propositional Logic', duration_minutes: 95 },
          { lecture_num: 12, title: 'Proof Techniques: Direct, Contradiction & Induction', duration_minutes: 95 }
        ]
      },
      {
        id: 'dm_sets_relations',
        name: 'Sets, Relations, Functions & Lattices',
        subtopics: ['Set Operations & Power Sets', 'Equivalence Relations & Partitions', 'Posets & Hasse Diagrams', 'Lattices', 'Functions'],
        lecture_count: 12,
        pyq_count: 45,
        difficulty_level: 'Medium',
        lectures: [
          { lecture_num: 13, title: 'Set Operations, Venn Diagrams & Power Sets', duration_minutes: 85 },
          { lecture_num: 14, title: 'Cartesian Products & Binary Relations', duration_minutes: 90 },
          { lecture_num: 15, title: 'Reflexive, Symmetric & Transitive Relations', duration_minutes: 90 },
          { lecture_num: 16, title: 'Closures of Relations (Reflexive, Symmetric, Transitive)', duration_minutes: 95 },
          { lecture_num: 17, title: 'Equivalence Relations & Equivalence Classes', duration_minutes: 90 },
          { lecture_num: 18, title: 'Partial Order Relations & Posets', duration_minutes: 95 },
          { lecture_num: 19, title: 'Hasse Diagrams, Maximal, Minimal, GLB, LUB', duration_minutes: 100 },
          { lecture_num: 20, title: 'Lattices: Definition, Bounded & Distributive Lattices', duration_minutes: 95 },
          { lecture_num: 21, title: 'Complemented Lattices & Boolean Algebras', duration_minutes: 90 },
          { lecture_num: 22, title: 'Functions: Injective, Surjective & Bijective', duration_minutes: 90 },
          { lecture_num: 23, title: 'Inverse Functions & Composition of Functions', duration_minutes: 85 },
          { lecture_num: 24, title: 'Number of Relations and Functions (Formulas & GATE Problems)', duration_minutes: 95 }
        ]
      },
      {
        id: 'dm_combinatorics',
        name: 'Combinatorics & Recurrence Relations',
        subtopics: ['Permutations & Combinations', 'Pigeonhole Principle', 'Inclusion-Exclusion', 'Recurrence Relations', 'Generating Functions'],
        lecture_count: 12,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: [
          { lecture_num: 25, title: 'Fundamental Principles of Counting: Sum & Product Rules', duration_minutes: 90 },
          { lecture_num: 26, title: 'Permutations & Combinations with/without Repetition', duration_minutes: 95 },
          { lecture_num: 27, title: 'Pigeonhole Principle & Generalized Pigeonhole Principle', duration_minutes: 90 },
          { lecture_num: 28, title: 'Principle of Inclusion and Exclusion (PIE)', duration_minutes: 95 },
          { lecture_num: 29, title: 'Derangements & Applications in Counting', duration_minutes: 90 },
          { lecture_num: 30, title: 'Catalan Numbers & Distribution of Objects into Boxes', duration_minutes: 100 },
          { lecture_num: 31, title: 'Formulation of Linear Recurrence Relations', duration_minutes: 90 },
          { lecture_num: 32, title: 'Solving First-Order Linear Recurrence Relations', duration_minutes: 90 },
          { lecture_num: 33, title: 'Solving Homogeneous Recurrence Relations with Characteristic Roots', duration_minutes: 95 },
          { lecture_num: 34, title: 'Solving Non-Homogeneous Recurrence Relations (Particular Solutions)', duration_minutes: 100 },
          { lecture_num: 35, title: 'Generating Functions: Definition & Standard Sequences', duration_minutes: 95 },
          { lecture_num: 36, title: 'Using Generating Functions to Solve Recurrences', duration_minutes: 100 }
        ]
      },
      {
        id: 'dm_graph_theory',
        name: 'Graph Theory & Group Theory',
        subtopics: ['Graph Types & Isomorphism', 'Eulerian & Hamiltonian Graphs', 'Planar Graphs & Coloring', 'Trees', 'Groups & Subgroups'],
        lecture_count: 12,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: [
          { lecture_num: 37, title: 'Graph Fundamentals: Vertices, Edges & Degree Sum Formula', duration_minutes: 90 },
          { lecture_num: 38, title: 'Graph Types: Complete, Bipartite, Regular & Cycles', duration_minutes: 90 },
          { lecture_num: 39, title: 'Subgraphs, Walks, Paths, Connected Components & Isomorphism', duration_minutes: 95 },
          { lecture_num: 40, title: 'Euler Paths and Euler Circuits (Euler Theorem)', duration_minutes: 95 },
          { lecture_num: 41, title: 'Hamiltonian Paths and Hamiltonian Circuits (Dirac & Ore Theorems)', duration_minutes: 95 },
          { lecture_num: 42, title: 'Planar Graphs, Regions & Euler’s Formula ($V - E + F = 2$)', duration_minutes: 100 },
          { lecture_num: 43, title: 'Non-Planar Graphs ($K_5, K_{3,3}$) & Kuratowski Theorem', duration_minutes: 95 },
          { lecture_num: 44, title: 'Vertex Coloring, Chromatic Number & Four Color Theorem', duration_minutes: 90 },
          { lecture_num: 45, title: 'Edge Coloring, Matching & Hall’s Marriage Theorem', duration_minutes: 90 },
          { lecture_num: 46, title: 'Trees, Spanning Trees & Properties of Acyclic Graphs', duration_minutes: 90 },
          { lecture_num: 47, title: 'Algebraic Structures: Semi-groups, Monoids & Groups', duration_minutes: 95 },
          { lecture_num: 48, title: 'Subgroups, Cyclic Groups, Cosets & Lagrange’s Theorem', duration_minutes: 100 }
        ]
      }
    ],
    dpps: Array.from({ length: 6 }, (_, i) => ({
      dpp_num: i + 1,
      title: `Discrete Mathematics DPP - ${i + 1}`,
      questions_count: 10
    }))
  },

  // 5. Data Structures and Algorithms (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'dsa',
    code: 'CS-DSA',
    name: 'Data Structures & Algorithms',
    icon: 'folder-tree',
    color: '#0284C7', // Sky Blue
    default_order: 5,
    target_week: 5,
    total_lectures: 30,
    is_lecture_count_estimated: 1, // Estimated
    total_dpps: null, // Unknown/unset
    topics: [
      {
        id: 'dsa_asymptotics',
        name: 'Asymptotic Analysis & Recurrences',
        subtopics: ['Big-O, Omega, Theta', 'Master Theorem', 'Substitution Method'],
        lecture_count: 5,
        pyq_count: 35,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 5 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Asymptotic Analysis & Recurrence - Lecture ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dsa_linear_ds',
        name: 'Linear Data Structures (Arrays, Lists, Stacks, Queues)',
        subtopics: ['Array Mapping', 'Linked Lists', 'Stacks & Queues'],
        lecture_count: 6,
        pyq_count: 35,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 6,
          title: `Linear Data Structures - Lecture ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dsa_trees_bst',
        name: 'Trees, BST, AVL & Heaps',
        subtopics: ['Tree Traversals', 'BST Operations', 'AVL Rotations', 'Binary Heaps'],
        lecture_count: 7,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 12,
          title: `Trees, BST & Heaps - Lecture ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dsa_hashing_graphs',
        name: 'Hashing & Graph Algorithms',
        subtopics: ['Hash Tables & Probing', 'BFS/DFS', 'Dijkstra', 'Prim & Kruskal'],
        lecture_count: 6,
        pyq_count: 40,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 19,
          title: `Hashing & Graph Algorithms - Lecture ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dsa_paradigms_np',
        name: 'Divide & Conquer, Greedy, DP & NP-Complete',
        subtopics: ['Quick/Merge Sort', 'Greedy Choice', 'Dynamic Programming', 'NP-Completeness'],
        lecture_count: 6,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 25,
          title: `Algorithm Design Paradigms - Lecture ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 6. DBMS (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'dbms',
    code: 'CS-DBMS',
    name: 'DBMS',
    icon: 'database',
    color: '#059669', // Green
    default_order: 6,
    target_week: 6,
    total_lectures: 30,
    is_lecture_count_estimated: 1, // Estimated
    total_dpps: null,
    topics: [
      {
        id: 'dbms_er_rel',
        name: 'ER Models & Relational Algebra',
        subtopics: ['ER Diagrams', 'Relational Algebra', 'Tuple Calculus'],
        lecture_count: 7,
        pyq_count: 35,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 1,
          title: `ER Model & Relational Algebra - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dbms_sql',
        name: 'SQL Queries & Integrity Constraints',
        subtopics: ['DDL, DML', 'Nested Queries', 'Group By & Having', 'Triggers & Views'],
        lecture_count: 6,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 8,
          title: `SQL Queries & Constraints - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dbms_norm',
        name: 'Normalization & Functional Dependencies',
        subtopics: ['Closure & Candidate Keys', '1NF, 2NF, 3NF, BCNF', 'Lossless Join & Dependency Preservation'],
        lecture_count: 7,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 14,
          title: `Functional Dependencies & Normalization - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dbms_trans',
        name: 'Transactions & Concurrency Control',
        subtopics: ['ACID Properties', 'Serializability', 'Locking Protocols (2PL)', 'Timestamping'],
        lecture_count: 6,
        pyq_count: 40,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 21,
          title: `Transactions & Concurrency - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dbms_index',
        name: 'File Structures, B-Trees & B+ Trees',
        subtopics: ['Indexing', 'B-Trees', 'B+ Trees', 'Hashing in DB'],
        lecture_count: 4,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 4 }, (_, i) => ({
          lecture_num: i + 27,
          title: `Indexing & B+ Trees - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 7. Operating Systems (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'os',
    code: 'CS-OS',
    name: 'Operating Systems',
    icon: 'cpu',
    color: '#3B82F6', // Blue
    default_order: 7,
    target_week: 7,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'os_sched',
        name: 'Processes, Threads & CPU Scheduling',
        subtopics: ['Process States', 'Fork/Exec', 'Scheduling Algorithms'],
        lecture_count: 8,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Processes & CPU Scheduling - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'os_sync_dead',
        name: 'Process Synchronization & Deadlocks',
        subtopics: ['Critical Section', 'Semaphores', 'Banker’s Algorithm'],
        lecture_count: 8,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 9,
          title: `Synchronization & Deadlocks - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'os_mem',
        name: 'Memory Management & Virtual Memory',
        subtopics: ['Paging', 'Multi-level Paging', 'TLB', 'Page Replacement'],
        lecture_count: 8,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 17,
          title: `Memory Management & Virtual Memory - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'os_storage',
        name: 'Disk Scheduling & File Systems',
        subtopics: ['Disk Algorithms', 'File Allocation', 'Inodes'],
        lecture_count: 6,
        pyq_count: 30,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 25,
          title: `Storage & File Systems - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 8. Computer Networks (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'cn',
    code: 'CS-CN',
    name: 'Computer Networks',
    icon: 'network',
    color: '#6366F1', // Indigo
    default_order: 8,
    target_week: 8,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'cn_data_link',
        name: 'Physical & Data Link Layer',
        subtopics: ['Framing', 'CRC & Error Control', 'Sliding Window (GBN, SR)', 'CSMA/CD'],
        lecture_count: 9,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 9 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Physical & Data Link Layer - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cn_network',
        name: 'Network Layer & IP Addressing',
        subtopics: ['IPv4 Header', 'CIDR & Subnetting', 'Routing: Distance Vector & Link State', 'NAT & ARP'],
        lecture_count: 9,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 9 }, (_, i) => ({
          lecture_num: i + 10,
          title: `Network Layer & Routing - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cn_transport',
        name: 'Transport Layer & TCP/UDP',
        subtopics: ['TCP 3-Way Handshake', 'Flow Control', 'Congestion Control (Slow Start, AIMD)'],
        lecture_count: 7,
        pyq_count: 35,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 19,
          title: `Transport Layer & TCP - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cn_app_sec',
        name: 'Application Layer & Network Security',
        subtopics: ['DNS & HTTP', 'SMTP & Email', 'RSA & Cryptography'],
        lecture_count: 5,
        pyq_count: 25,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 5 }, (_, i) => ({
          lecture_num: i + 26,
          title: `Application Layer & Security - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 9. Digital Logic (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'dl',
    code: 'CS-DL',
    name: 'Digital Logic',
    icon: 'toggle-left',
    color: '#EAB308', // Yellow-amber
    default_order: 9,
    target_week: 9,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'dl_boolean',
        name: 'Boolean Algebra & Minimization',
        subtopics: ['Boolean Functions & Duals', 'Karnaugh Maps (K-Map)', 'Quine-McCluskey'],
        lecture_count: 7,
        pyq_count: 35,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Boolean Algebra & K-Maps - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dl_combinational',
        name: 'Combinational Circuits',
        subtopics: ['Adders & Subtractors', 'Multiplexers & Demux', 'Decoders & Encoders'],
        lecture_count: 8,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 8,
          title: `Combinational Circuits - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dl_sequential',
        name: 'Sequential Circuits & Flip-Flops',
        subtopics: ['Latches & Flip-Flops (SR, JK, D, T)', 'Counters (Sync & Async)', 'Shift Registers'],
        lecture_count: 10,
        pyq_count: 45,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 10 }, (_, i) => ({
          lecture_num: i + 16,
          title: `Sequential Circuits & Counters - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'dl_number_rep',
        name: 'Number Representations & Fixed Point',
        subtopics: ['1s and 2s Complement', 'Floating Point', 'Precision'],
        lecture_count: 5,
        pyq_count: 25,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 5 }, (_, i) => ({
          lecture_num: i + 26,
          title: `Number Representations - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 10. Computer Organization and Architecture (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'coa',
    code: 'CS-COA',
    name: 'Computer Organization & Architecture',
    icon: 'hard-drive',
    color: '#0284C7', // Sky Blue
    default_order: 10,
    target_week: 10,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'coa_instr',
        name: 'Machine Instructions & Addressing Modes',
        subtopics: ['Instruction Formats', 'Addressing Modes', 'ALU & Booth Algorithm'],
        lecture_count: 7,
        pyq_count: 40,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 7 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Instruction Formats & Addressing - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'coa_pipe',
        name: 'Instruction Pipelining & Hazards',
        subtopics: ['Pipeline Stages', 'Data & Control Hazards', 'Speedup & CPI'],
        lecture_count: 8,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 8,
          title: `Pipelining & Hazards - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'coa_mem',
        name: 'Memory Hierarchy & Cache Mapping',
        subtopics: ['Direct/Associative Cache', 'AMAT Calculations', 'Cache Replacement & Write Policies'],
        lecture_count: 9,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 9 }, (_, i) => ({
          lecture_num: i + 16,
          title: `Cache Memory & Hierarchy - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'coa_io',
        name: 'I/O Organization & DMA',
        subtopics: ['Interrupts', 'DMA Controllers', 'Cycle Stealing'],
        lecture_count: 6,
        pyq_count: 25,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 25,
          title: `I/O Interface & DMA - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 11. Compiler Design (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'cd',
    code: 'CS-CD',
    name: 'Compiler Design',
    icon: 'code',
    color: '#E11D48', // Rose
    default_order: 11,
    target_week: 11,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'cd_lex',
        name: 'Lexical Analysis',
        subtopics: ['Tokens, Patterns, Lexemes', 'Lexical Errors & DFA', 'Regular Expressions in Lex'],
        lecture_count: 6,
        pyq_count: 20,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Lexical Analysis - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cd_parsing',
        name: 'Syntax Analysis & Parsing',
        subtopics: ['FIRST & FOLLOW', 'LL(1) Parsers', 'LR(0), SLR(1), CLR(1), LALR(1)'],
        lecture_count: 12,
        pyq_count: 50,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 12 }, (_, i) => ({
          lecture_num: i + 7,
          title: `Syntax Analysis & Parsers - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cd_sdt',
        name: 'Syntax Directed Translation (SDT)',
        subtopics: ['S-Attributed Definitions', 'L-Attributed Definitions', 'Annotated Parse Trees'],
        lecture_count: 6,
        pyq_count: 25,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 19,
          title: `Syntax Directed Translation - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'cd_opt',
        name: 'Intermediate Code & Code Optimization',
        subtopics: ['Three Address Code', 'Basic Blocks & Flow Graphs', 'Data Flow Analysis'],
        lecture_count: 6,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 6 }, (_, i) => ({
          lecture_num: i + 25,
          title: `Intermediate Code & Optimization - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 12. Engineering Mathematics (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'em',
    code: 'CS-EM',
    name: 'Engineering Mathematics',
    icon: 'variable',
    color: '#8B5CF6', // Purple
    default_order: 12,
    target_week: 12,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'em_overview',
        name: 'Core Engineering Math Topics',
        subtopics: ['Matrix Algebra', 'Differential Equations', 'Transform Calculus'],
        lecture_count: 30,
        pyq_count: 60,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 30 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Engineering Mathematics - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 13. Linear Algebra (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'la',
    code: 'CS-LA',
    name: 'Linear Algebra',
    icon: 'grid',
    color: '#7C3AED', // Deep Purple
    default_order: 13,
    target_week: 13,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'la_matrices',
        name: 'Matrices, Determinants & Rank',
        subtopics: ['Matrix Algebra', 'Row Echelon Form', 'Rank'],
        lecture_count: 10,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 10 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Matrices & Rank - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'la_systems',
        name: 'System of Linear Equations',
        subtopics: ['Homogeneous & Non-Homogeneous Systems', 'Consistency', 'Vector Spaces'],
        lecture_count: 10,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 10 }, (_, i) => ({
          lecture_num: i + 11,
          title: `Linear Systems & Spaces - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'la_eigen',
        name: 'Eigenvalues & Eigenvectors',
        subtopics: ['Characteristic Equations', 'Cayley-Hamilton Theorem', 'Diagonalization', 'LU Decomposition'],
        lecture_count: 10,
        pyq_count: 35,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 10 }, (_, i) => ({
          lecture_num: i + 21,
          title: `Eigenvalues & Diagonalization - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 14. Probability and Statistics (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'prob',
    code: 'CS-PS',
    name: 'Probability and Statistics',
    icon: 'percent',
    color: '#F43F5E', // Rose
    default_order: 14,
    target_week: 14,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'prob_axioms',
        name: 'Probability Axioms & Bayes Theorem',
        subtopics: ['Conditional Probability', 'Independent Events', 'Bayes Formula'],
        lecture_count: 10,
        pyq_count: 35,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 10 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Probability & Bayes Theorem - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'prob_rv',
        name: 'Random Variables & Distributions',
        subtopics: ['Discrete & Continuous RV', 'Expectation & Variance', 'Binomial, Poisson & Normal Distributions'],
        lecture_count: 12,
        pyq_count: 40,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 12 }, (_, i) => ({
          lecture_num: i + 11,
          title: `Random Variables & Distributions - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'prob_stats',
        name: 'Statistics & Sampling',
        subtopics: ['Mean, Median, Mode', 'Standard Deviation', 'Central Limit Theorem'],
        lecture_count: 8,
        pyq_count: 25,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 8 }, (_, i) => ({
          lecture_num: i + 23,
          title: `Statistics & Sampling - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 15. Calculus and Optimization (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'calc',
    code: 'CS-CO',
    name: 'Calculus and Optimization',
    icon: 'trending-up',
    color: '#14B8A6', // Teal
    default_order: 15,
    target_week: 15,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'calc_limits_diff',
        name: 'Limits, Continuity & Maxima/Minima',
        subtopics: ['L\'Hopital\'s Rule', 'Taylor Series', 'Maxima & Minima'],
        lecture_count: 15,
        pyq_count: 35,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 15 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Calculus Limits & Maxima - Part ${i + 1}`,
          duration_minutes: 90
        }))
      },
      {
        id: 'calc_integrals_opt',
        name: 'Definite Integrals & Optimization',
        subtopics: ['Definite Integrals', 'Multiple Integrals', 'Gradient & Optimization'],
        lecture_count: 15,
        pyq_count: 35,
        difficulty_level: 'Hard',
        lectures: Array.from({ length: 15 }, (_, i) => ({
          lecture_num: i + 16,
          title: `Integrals & Optimization - Part ${i + 1}`,
          duration_minutes: 90
        }))
      }
    ]
  },

  // 16. Basics of Computer Systems (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'bcs',
    code: 'CS-BCS',
    name: 'Basics of Computer Systems',
    icon: 'monitor',
    color: '#64748B', // Slate
    default_order: 16,
    target_week: 16,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'bcs_intro',
        name: 'Hardware & OS Foundations',
        subtopics: ['Computer Architecture Basics', 'BIOS, Booting & OS Kernel', 'System Interfaces'],
        lecture_count: 30,
        pyq_count: 20,
        difficulty_level: 'Easy',
        lectures: Array.from({ length: 30 }, (_, i) => ({
          lecture_num: i + 1,
          title: `Computer Systems Foundations - Part ${i + 1}`,
          duration_minutes: 85
        }))
      }
    ]
  },

  // 17. Fundamental of C Language (Estimated: 30 Lectures, DPP: Unset)
  {
    id: 'c_fund',
    code: 'CS-FCL',
    name: 'Fundamental of C Language',
    icon: 'file-code',
    color: '#0EA5E9', // Sky
    default_order: 17,
    target_week: 17,
    total_lectures: 30,
    is_lecture_count_estimated: 1,
    total_dpps: null,
    topics: [
      {
        id: 'c_fund_syntax',
        name: 'C Syntax & Algorithmic Thinking',
        subtopics: ['Problem Solving in C', 'Data Types & Control Structures', 'Pointers Practice'],
        lecture_count: 30,
        pyq_count: 30,
        difficulty_level: 'Medium',
        lectures: Array.from({ length: 30 }, (_, i) => ({
          lecture_num: i + 1,
          title: `C Language Fundamentals - Part ${i + 1}`,
          duration_minutes: 85
        }))
      }
    ]
  }
];
