
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  addDoc, 
  query, 
  where, 
  increment,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Course, Quiz, User, QuizAttempt, SupportTicket, Message, Role, CourseProgress, CourseRating } from '../types';

// --- SERVICE FUNCTIONS (FIRESTORE) ---

export const getCourses = async (): Promise<Course[]> => {
  const querySnapshot = await getDocs(collection(db, 'courses'));
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      ...data, 
      id: doc.id,
      totalStudents: data.totalStudents || 0,
      updatedAt: data.updatedAt || 0
    } as Course;
  });
};

export const getCoursesByStatus = async (status: 'draft' | 'published' | 'review'): Promise<Course[]> => {
  const q = query(collection(db, 'courses'), where('status', '==', status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      ...data, 
      id: doc.id,
      totalStudents: data.totalStudents || 0,
      updatedAt: data.updatedAt || 0
    } as Course;
  });
};

export const getCourseById = async (id: string): Promise<Course | undefined> => {
  const docRef = doc(db, 'courses', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return { 
      ...data, 
      id: docSnap.id,
      totalStudents: data.totalStudents || 0,
      updatedAt: data.updatedAt || 0
    } as Course;
  }
  return undefined;
};

export const approveCourse = async (courseId: string, price: number): Promise<void> => {
  const docRef = doc(db, 'courses', courseId);
  await updateDoc(docRef, {
    price,
    status: 'published',
    updatedAt: Date.now()
  });
};

export const createUserProfile = async (user: User): Promise<void> => {
  await setDoc(doc(db, 'users', user.uid), user);
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), uid: docSnap.id } as User;
  }
  return null;
};

// --- PROGRESS TRACKING ---

export const markLessonComplete = async (userId: string, courseId: string, lessonId: string): Promise<void> => {
  const progressId = `${userId}_${courseId}`;
  const progressRef = doc(db, 'course_progress', progressId);
  const docSnap = await getDoc(progressRef);

  if (docSnap.exists()) {
    await updateDoc(progressRef, {
      completedLessons: arrayUnion(lessonId),
      lastUpdated: Date.now()
    });
  } else {
    await setDoc(progressRef, {
      userId,
      courseId,
      completedLessons: [lessonId],
      lastUpdated: Date.now()
    });
  }
};

export const getUserCourseProgress = async (userId: string, courseId: string): Promise<CourseProgress | null> => {
  const progressId = `${userId}_${courseId}`;
  const progressRef = doc(db, 'course_progress', progressId);
  const docSnap = await getDoc(progressRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as CourseProgress;
  }
  return null;
};


// --- QUIZZES ---

export const createQuiz = async (quizData: Omit<Quiz, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'quizzes'), quizData);
  return docRef.id;
};

export const updateQuiz = async (quizId: string, quizData: Partial<Quiz>): Promise<void> => {
  const docRef = doc(db, 'quizzes', quizId);
  await updateDoc(docRef, quizData);
};

export const getQuizById = async (id: string): Promise<Quiz | undefined> => {
  const docRef = doc(db, 'quizzes', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { ...docSnap.data(), id: docSnap.id } as Quiz;
  }
  return undefined;
};

export const submitQuizAttempt = async (attempt: QuizAttempt): Promise<void> => {
  await addDoc(collection(db, 'quiz_attempts'), attempt);
};

// --- COURSES ---

export const enrollUserInCourse = async (userId: string, courseId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const courseRef = doc(db, 'courses', courseId);
  
  const courseSnap = await getDoc(courseRef);
  if (!courseSnap.exists()) return;
  const courseData = courseSnap.data() as Course;
  const price = courseData.price || 0;

  await updateDoc(userRef, {
    enrolledCourses: arrayUnion(courseId)
  });

  await updateDoc(courseRef, {
    totalStudents: increment(1),
    totalRevenue: increment(price),
    updatedAt: Date.now()
  });
};

export const createCourse = async (courseData: Omit<Course, 'id' | 'totalStudents' | 'avgRating'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'courses'), {
    ...courseData,
    totalStudents: 0,
    avgRating: 0,
    totalRatings: 0,
    totalRevenue: 0,
    status: 'review', // Default for new courses
    updatedAt: Date.now()
  });
  return docRef.id;
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<void> => {
  const docRef = doc(db, 'courses', courseId);
  const { id, ...data } = courseData as any; 
  await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now()
  });
};

// --- RATINGS ---

export const submitCourseRating = async (userId: string, courseId: string, rating: number): Promise<void> => {
  const ratingId = `${userId}_${courseId}`;
  const ratingRef = doc(db, 'course_ratings', ratingId);
  
  await setDoc(ratingRef, {
    userId,
    courseId,
    rating,
    timestamp: Date.now()
  });

  const q = query(collection(db, 'course_ratings'), where('courseId', '==', courseId));
  const snap = await getDocs(q);
  
  let total = 0;
  snap.forEach(d => total += d.data().rating);
  const count = snap.size;
  const avg = count > 0 ? Number((total / count).toFixed(1)) : 0;

  const courseRef = doc(db, 'courses', courseId);
  await updateDoc(courseRef, {
    avgRating: avg,
    totalRatings: count
  });
};

export const getUserRating = async (userId: string, courseId: string): Promise<number | null> => {
  const ratingId = `${userId}_${courseId}`;
  const ratingRef = doc(db, 'course_ratings', ratingId);
  const snap = await getDoc(ratingRef);
  
  if (snap.exists()) {
    return snap.data().rating as number;
  }
  return null;
};

// --- STATS ---

export const getTeacherStats = async (teacherId: string) => {
  const coursesQuery = query(collection(db, 'courses'), where('teacherId', '==', teacherId));
  const coursesSnap = await getDocs(coursesQuery);
  const courses = coursesSnap.docs.map(d => {
    const data = d.data();
    return { 
      ...data, 
      id: d.id,
      totalStudents: data.totalStudents || 0,
      totalRevenue: data.totalRevenue || 0
    } as Course;
  });

  const totalSales = courses.reduce((acc, curr) => acc + (curr.totalRevenue || 0), 0);
  const totalStudents = courses.reduce((acc, curr) => acc + curr.totalStudents, 0);
  
  const avgRating = courses.length > 0 
    ? (courses.reduce((acc, curr) => acc + curr.avgRating, 0) / courses.length).toFixed(1)
    : 0;

  const ticketsQuery = query(collection(db, 'support_tickets'), where('teacherId', '==', teacherId));
  const ticketsSnap = await getDocs(ticketsQuery);
  const tickets = ticketsSnap.docs.map(d => ({ ...d.data(), id: d.id } as SupportTicket));
  
  return {
    totalSales,
    students: totalStudents,
    rating: avgRating,
    tickets: tickets
  };
};

export const getAdminStats = async () => {
  const coursesSnap = await getDocs(collection(db, 'courses'));
  const usersSnap = await getDocs(collection(db, 'users'));
  
  const courses = coursesSnap.docs.map(d => d.data() as Course);
  const totalRevenue = courses.reduce((acc, curr) => acc + (curr.totalRevenue || (curr.totalStudents * curr.price) || 0), 0);
  
  const reviewCountSnap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'review')));

  let students = 0;
  let teachers = 0;
  let admins = 0;

  usersSnap.forEach(doc => {
      const role = doc.data().role;
      if (role === 'student') students++;
      else if (role === 'teacher') teachers++;
      else if (role === 'admin') admins++;
  });

  return {
    revenue: totalRevenue,
    activeUsers: usersSnap.size,
    pendingApprovals: reviewCountSnap.size,
    roleDistribution: [
        { name: 'Estudantes', value: students },
        { name: 'Professores', value: teachers },
        { name: 'Admins', value: admins }
    ]
  };
};

// --- SUPPORT TICKET FUNCTIONS ---

export const getTicketsByStudent = async (studentId: string): Promise<SupportTicket[]> => {
  const q = query(collection(db, 'support_tickets'), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportTicket)).sort((a,b) => b.lastUpdated - a.lastUpdated);
};

export const getTicketsByTeacher = async (teacherId: string): Promise<SupportTicket[]> => {
  const q = query(collection(db, 'support_tickets'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ ...d.data(), id: d.id } as SupportTicket)).sort((a,b) => b.lastUpdated - a.lastUpdated);
};

export const createTicket = async (studentId: string, studentName: string, courseId: string, subject: string, message: string): Promise<SupportTicket | null> => {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const newTicketData = {
    studentId,
    studentName,
    teacherId: course.teacherId,
    courseId: course.id,
    courseName: course.title,
    subject,
    status: 'open',
    createdAt: new Date().toISOString().split('T')[0],
    lastUpdated: Date.now(),
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderId: studentId,
        senderName: studentName,
        text: message,
        timestamp: Date.now()
      }
    ]
  };

  const docRef = await addDoc(collection(db, 'support_tickets'), newTicketData);
  return { id: docRef.id, ...newTicketData } as SupportTicket;
};

export const sendMessage = async (ticketId: string, senderId: string, senderName: string, text: string): Promise<Message> => {
  const ticketRef = doc(db, 'support_tickets', ticketId);
  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId,
    senderName,
    text,
    timestamp: Date.now()
  };

  await updateDoc(ticketRef, {
    messages: arrayUnion(newMessage),
    lastUpdated: Date.now()
  });

  return newMessage;
};

export const updateTicketStatus = async (ticketId: string, status: 'open' | 'closed'): Promise<void> => {
  const ticketRef = doc(db, 'support_tickets', ticketId);
  await updateDoc(ticketRef, { status });
}

// --- ADMIN MANAGEMENT FUNCTIONS ---

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ ...d.data(), uid: d.id } as User));
};

export const updateUserRole = async (userId: string, newRole: Role): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { role: newRole });
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
       const userData = userSnap.data();
       if (userData.role === 'teacher') {
          const coursesQuery = query(collection(db, 'courses'), where('teacherId', '==', userId));
          const coursesSnap = await getDocs(coursesQuery);
          
          const deletePromises = coursesSnap.docs.map(d => deleteDoc(d.ref));
          await Promise.all(deletePromises);
       }
    }

    await deleteDoc(userRef);
    return true;
  } catch (e) {
    console.error("Error deleting user:", e);
    return false;
  }
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    return true;
  } catch (e) {
    return false;
  }
}
