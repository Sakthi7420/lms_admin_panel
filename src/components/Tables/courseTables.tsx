


import { Button } from "../../components/ui/button";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit, Trash } from "lucide-react";
import axios from "axios";
import { ColDef } from "ag-grid-community";

// TypeScript types for the component props
interface CourseTableProps {
  editable?: boolean;
}

// TypeScript types for course data
interface CourseData {
  id: number;
  courseName: string;
  courseDesc: string;
  courseCategoryId: number;
  courseInstructorId: number;
  courseCategory: string;
  courseInstructor: string;
}

interface courseOptions {
  id: any;
  courseCategory: any;
}

interface instructorOptions{
  id: any;
  fullName: any;
}

// Helper to get the token from local storage
const getToken = () => localStorage.getItem("authToken");

const CourseTable = ({ editable = true }: CourseTableProps) => {
  const [courseData, setCourseData] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [courseCategory, setCourseCategory] = useState<courseOptions[]>([]);
  const [instructor, setInstructor] = useState<instructorOptions[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState< CourseData | null>(null);
  const [newCourse, setNewCourse] = useState<CourseData>({
    id: 0,
    courseName: "",
    courseDesc: "",
    courseCategoryId: 0,
    courseInstructorId: 0,
    courseCategory: "",
    courseInstructor: "",
  });

  // Fetch courses
  const fetchCourses = async () => {
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to view courses.");
      return;
    }

    try {
      const response = await axios.get(`/course`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('course', response.data);

      const courses = response.data.course.map((course: any) => ({
        id: course.id,
        courseName: course.courseName,
        courseDesc: course.courseDesc,
        courseCategory: course.category?.courseCategory || "Unknown",
        courseInstructor: course.instructor
          ? `${course.instructor.firstName} ${course.instructor.lastName}`
          : "Unknown Instructor",
        courseCategoryId: course.courseCategoryId || 0,
        courseInstructorId: course.courseInstructorId || 0,
      }));

      console.log('courses', courses);

      const responseCategory = await axios.get(`/coursecategory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      console.log('rescategory', responseCategory)

        const courseCategory = responseCategory.data.category.map((category: any)=>({
          id: category.id,
          courseCategory: category.courseCategory
        }));

        console.log('courseCategory', courseCategory);
        setCourseCategory(courseCategory);

        const responseInstructor = await axios.get(`/users`,{
          headers:{
            Authorization: `Bearer ${token}`,
          }
        })
        console.log('responseInstructor', responseInstructor.data);

        const instructor = responseInstructor.data.Users
        .filter((user: any) => {
          return (
            Array.isArray(user.role)
              ? user.role.some((r: any) => r.name.toLowerCase() === 'trainer')
              : user.role && user.role.name.toLowerCase() === 'trainer'
          );
        })
        .map((user: any) => ({
          fullName: `${user.firstName} ${user.lastName}`,
          id: user.id,  // Ensure you also include an id field
        }));

      console.log('Filtered Instructor (Trainer only):', instructor);
      setInstructor(instructor);


      setCourseData(courses);
    } catch (error) {
      console.error("Failed to fetch courses", error);
      toast.error("Failed to fetch courses. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Open modal to add a new course
  const addNewRow = () => {
    setEditing(false);
    setNewCourse({
      id: 0,
      courseName: "",
      courseDesc: "",
      courseCategoryId: 0,
      courseInstructorId: 0,
      courseCategory: "",
      courseInstructor: "",
    });
    setIsModalOpen(true);
  };

  const confirmDeleteCourse = (data: CourseData) => {
      const course = courseData.find((course) => course.id === data.id);
      if (course) {
        setCourseToDelete(course);
        setIsDeleteModalOpen(true);
      }
    };  
  
    const handleDeleteCourse = async () => {
        if (!courseToDelete) return;
    
        const token = getToken();
        if (!token) {
          toast.error("You must be logged in to delete a course.");
          return;
        }
    
        try {
          await axios.delete(`/course/${courseToDelete.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setCourseData((prev) => prev.filter((course) => course.id !== courseToDelete.id));
          toast.success("Course deleted successfully!");
        } catch (error) {
          console.error("Failed to delete course", error);
          toast.error("Failed to delete the course. Please try again later.");
        } finally {
          setIsDeleteModalOpen(false);
          setCourseToDelete(null);
        }
      };
  
      const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
      };

  // Edit a course
  const editCourse = (data: any) => {
    const courseToEdit = courseData.find((course) => course.id === data.data.id);
    if (courseToEdit) {
      setEditing(true);
      setNewCourse(courseToEdit);
      setIsModalOpen(true);
    }
  };

  // Close the modal
  const handleModalClose = () => {
    setIsModalOpen(false);
    setNewCourse({
      id: 0,
      courseName: "",
      courseDesc: "",
      courseCategoryId: 0,
      courseInstructorId: 0,
      courseCategory: "",
      courseInstructor: "",
    });
  };

  // Handle form submission (Create or Update)
  const handleFormSubmit = async () => {
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to perform this action.");
      return;
    }

    const courseToSubmit = {
      courseName: newCourse.courseName,
      courseDesc: newCourse.courseDesc,
      courseCategoryId: newCourse.courseCategoryId,
      courseInstructorId: newCourse.courseInstructorId,
    };

    console.log('courseToSubmit',courseToSubmit)

    try {
      if (editing) {
        await axios.put(`/course/${newCourse.id}`, courseToSubmit, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchCourses();
        setCourseData((prev) =>
          prev.map((course) => (course.id === newCourse.id ? { ...course, ...courseToSubmit } : course))
        );
        toast.success("Course updated successfully!");

      } else {
        const response = await axios.post(`/course`, courseToSubmit, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchCourses();
        setCourseData((prev) => [...prev, response.data]);

        toast.success("Course added successfully!");
      }
    } catch (error) {
      console.error("Failed to update course", error);
      toast.error("Failed to update the course. Please try again later.");
    }

    handleModalClose();
  };

  // Define column definitions for the grid
  useEffect(() => {
    setColDefs([
      { headerName: "Course Name", field: "courseName", editable: false },
      { headerName: "Description", field: "courseDesc", editable: false, width: 450 },
      { headerName: "Category", field: "courseCategory", editable: false, width: 180 },
      { headerName: "Instructor", field: "courseInstructor", editable: false, width: 180 },
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: any) => (
          <div className="flex space-x-2">
            <Button onClick={() => editCourse(params)} className="bg-blue-500 text-white">
              <Edit className="h-5 w-5" />
            </Button>
            <Button onClick={() => confirmDeleteCourse(params.data)} className="bg-red-500 text-white">
              <Trash className="h-5 w-5" />
            </Button>
          </div>
        ),
        editable: false,
      },
    ]);
  }, [courseData]);

  // Unique categories and instructors
  const uniqueCategories = Array.from(
    new Map(courseData.map((course) => [course.courseCategory, course.courseCategoryId]))
  );
  const uniqueInstructors = Array.from(
    new Map(courseData.map((course) => [course.courseInstructor, course.courseInstructorId]))
  );

  return (
    <div className="flex-1 p-4 mt-10 ml-24">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg mb-6 w-[1147px]">
        <h2 className="text-2xl font-bold">Courses</h2>
        <Button onClick={addNewRow} className="bg-yellow-400 text-gray-900 font-semibold">
          + New Course
        </Button>
      </div>

      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>
              Are you sure you want to delete the course {" "}
              <span className="font-bold">
                {courseToDelete?.courseName?.charAt(0).toUpperCase() +
                  courseToDelete?.courseName?.slice(1).toLowerCase() || "this course"}
              </span>
              ?
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                onClick={handleCancelDelete}
                className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteCourse}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="ag-theme-quartz" style={{ height: "70vh", width: "88%" }}>
        <AgGridReact
          rowSelection="multiple"
          suppressRowClickSelection
          suppressMovableColumns
          loading={loading}
          columnDefs={colDefs}
          rowData={courseData}
          defaultColDef={{ editable, sortable: true, filter: true, resizable: true }}
          animateRows
        />
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold">{editing ? "Edit Course" : "Add New Course"}</h2>
            <form>
              <div className="mb-4">
                <label className="block font-medium">Course Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={newCourse.courseName}
                  onChange={(e) => setNewCourse({ ...newCourse, courseName: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Description</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={newCourse.courseDesc}
                  onChange={(e) => setNewCourse({ ...newCourse, courseDesc: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Category</label>
                <select
                  className="w-full border rounded p-2"
                  value={newCourse.courseCategoryId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      courseCategoryId: parseInt(e.target.value, 10),
                      courseCategory:
                        uniqueCategories.find(([_, id]) => id === parseInt(e.target.value, 10))?.[0] || "",
                    })
                  }
                >
                  <option value="">Select Category</option>
                  {courseCategory.map((category) => (
                    <option key={category.courseCategory} value={category.id}>
                      {category.courseCategory}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block font-medium">Instructor</label>
                <select
                  className="w-full border rounded p-2"
                  value={newCourse.courseInstructorId}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      courseInstructorId: parseInt(e.target.value, 10),
                      courseInstructor:
                        uniqueInstructors.find(([_, id]) => id === parseInt(e.target.value, 10))?.[0] || "",
                    })
                  }
                >
                  <option value="">Select Instructor</option>
                  {instructor.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-4">
                <Button
                  onClick={handleFormSubmit}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  {editing ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={handleModalClose}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseTable;