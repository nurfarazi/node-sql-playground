export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

export type Category = {
  id: number;
  name: string;
  createdAt: string;
};

export type Course = {
  id: number;
  categoryId: number;
  title: string;
  description: string | null;
  level: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
};

export type Lesson = {
  id: number;
  courseId: number;
  title: string;
  content: string | null;
  position: number;
  createdAt: string;
  updatedAt: string | null;
};
