export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  icon: string;
  color: string;
  gradient: [string, string];
  queue_order: number;
  total_lectures: number;
  completed_lectures: number;
  is_lecture_count_estimated: number; // 0 = confirmed, 1 = estimated
  total_dpps: number;
  completed_dpps: number;
  pyqs_attempted: number;
  pyqs_correct: number;
  pyqs_target: number;
  is_active: number; // 1 = active subject being studied right now
  status: 'in_queue' | 'active' | 'completed' | 'doing' | 'done';
}

export const DEFAULT_GATE_SUBJECTS: SubjectItem[] = [
  // 1. C Programming (Priority 1 in default queue)
  {
    id: 'cs_cp',
    code: 'CS-CP',
    name: 'C Programming',
    icon: 'code-slash',
    color: '#8B5CF6', // Cyber Violet
    gradient: ['#8B5CF6', '#6366F1'],
    queue_order: 1,
    total_lectures: 22, // Confirmed PW Data
    completed_lectures: 0,
    is_lecture_count_estimated: 0,
    total_dpps: 11, // Confirmed PW Data
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 80,
    is_active: 1,
    status: 'active'
  },
  // 2. Theory of Computation
  {
    id: 'cs_toc',
    code: 'CS-TOC',
    name: 'Theory of Computation',
    icon: 'infinite',
    color: '#EC4899', // Pink
    gradient: ['#EC4899', '#D946EF'],
    queue_order: 2,
    total_lectures: 29, // Confirmed PW Data
    completed_lectures: 0,
    is_lecture_count_estimated: 0,
    total_dpps: 5, // Confirmed PW Data
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 100,
    is_active: 0,
    status: 'in_queue'
  },
  // 3. Discrete Mathematics
  {
    id: 'cs_dm',
    code: 'CS-DM',
    name: 'Discrete Mathematics',
    icon: 'grid',
    color: '#3B82F6', // Blue
    gradient: ['#3B82F6', '#1D4ED8'],
    queue_order: 3,
    total_lectures: 48, // Confirmed PW Data
    completed_lectures: 0,
    is_lecture_count_estimated: 0,
    total_dpps: 6, // Confirmed PW Data
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 120,
    is_active: 0,
    status: 'in_queue'
  },
  // 4. General Aptitude (Daily Companion)
  {
    id: 'cs_ga',
    code: 'CS-GA',
    name: 'General Aptitude',
    icon: 'compass',
    color: '#10B981', // Emerald
    gradient: ['#10B981', '#059669'],
    queue_order: 4,
    total_lectures: 18, // Confirmed PW Data
    completed_lectures: 0,
    is_lecture_count_estimated: 0,
    total_dpps: 19, // Confirmed PW Data
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 90,
    is_active: 0,
    status: 'in_queue'
  },
  // 5. Data Structures & Algorithms
  {
    id: 'cs_dsa',
    code: 'CS-DSA',
    name: 'Data Structures & Algorithms',
    icon: 'git-network',
    color: '#06B6D4', // Cyan
    gradient: ['#06B6D4', '#0284C7'],
    queue_order: 5,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 120,
    is_active: 0,
    status: 'in_queue'
  },
  // 6. Database Management Systems
  {
    id: 'cs_dbms',
    code: 'CS-DBMS',
    name: 'DBMS',
    icon: 'server',
    color: '#F59E0B', // Amber
    gradient: ['#F59E0B', '#D97706'],
    queue_order: 6,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 90,
    is_active: 0,
    status: 'in_queue'
  },
  // 7. Operating Systems
  {
    id: 'cs_os',
    code: 'CS-OS',
    name: 'Operating Systems',
    icon: 'hardware-chip',
    color: '#FF512F', // Flame
    gradient: ['#FF512F', '#DD2476'],
    queue_order: 7,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 90,
    is_active: 0,
    status: 'in_queue'
  },
  // 8. Computer Networks
  {
    id: 'cs_cn',
    code: 'CS-CN',
    name: 'Computer Networks',
    icon: 'globe',
    color: '#6366F1', // Indigo
    gradient: ['#6366F1', '#4F46E5'],
    queue_order: 8,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 90,
    is_active: 0,
    status: 'in_queue'
  },
  // 9. Digital Logic
  {
    id: 'cs_dl',
    code: 'CS-DL',
    name: 'Digital Logic',
    icon: 'flash',
    color: '#14B8A6', // Teal
    gradient: ['#14B8A6', '#0D9488'],
    queue_order: 9,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 70,
    is_active: 0,
    status: 'in_queue'
  },
  // 10. Computer Organization & Architecture
  {
    id: 'cs_coa',
    code: 'CS-COA',
    name: 'Computer Organization & Architecture',
    icon: 'layers',
    color: '#A855F7', // Purple
    gradient: ['#A855F7', '#7C3AED'],
    queue_order: 10,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 80,
    is_active: 0,
    status: 'in_queue'
  },
  // 11. Compiler Design
  {
    id: 'cs_cd',
    code: 'CS-CD',
    name: 'Compiler Design',
    icon: 'construct',
    color: '#F43F5E', // Rose
    gradient: ['#F43F5E', '#E11D48'],
    queue_order: 11,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 70,
    is_active: 0,
    status: 'in_queue'
  },
  // 12. Engineering Mathematics
  {
    id: 'cs_em',
    code: 'CS-EM',
    name: 'Engineering Mathematics',
    icon: 'calculator',
    color: '#EAB308', // Gold
    gradient: ['#EAB308', '#CA8A04'],
    queue_order: 12,
    total_lectures: 30, // Estimated
    completed_lectures: 0,
    is_lecture_count_estimated: 1,
    total_dpps: 0,
    completed_dpps: 0,
    pyqs_attempted: 0,
    pyqs_correct: 0,
    pyqs_target: 90,
    is_active: 0,
    status: 'in_queue'
  }
];
