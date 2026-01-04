
export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  enrolledCourses: string[]; // Array of Course IDs
}

export interface QuizOption {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  title: string;
  passingScore: number; // Percentage
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'text';
  videoUrl?: string; // YouTube/Vimeo embed ID or URL
  textContent?: string; // Markdown or plain text content
  description?: string;
  quizId?: string; // If type is quiz
  duration: string;
  // Editor temporary fields
  questions?: QuizQuestion[];
  passingScore?: number;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  teacherId: string;
  teacherName: string;
  thumbnailUrl: string;
  status: 'draft' | 'published' | 'review';
  modules: Module[];
  avgRating: number;
  totalRatings?: number; 
  totalStudents: number;
  totalRevenue?: number;
}

export interface CourseRating {
  userId: string;
  courseId: string;
  rating: number; // 0-5
  timestamp: number;
}

export interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessons: string[]; // Array of Lesson IDs
  lastUpdated: number;
}

export interface QuizAttempt {
  userId: string;
  quizId: string;
  score: number;
  passed: boolean;
  timestamp: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SupportTicket {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  courseId: string;
  courseName: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: string; // ISO Date string
  lastUpdated: number; // Timestamp for sorting
  messages: Message[];
}

export interface Payment {
  id: string; 
  userId: string;
  courseId: string;
  amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  invoiceUrl: string;
  createdAt: number;
}
