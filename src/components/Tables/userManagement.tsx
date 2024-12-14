import React, { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ColDef } from "ag-grid-community";
import { toast } from "react-toastify";
import { Edit, Slice, Trash } from "lucide-react";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import axios from "axios";
import { useParams } from "react-router-dom"; // Import useParams

interface User { 
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  password?: string;
  address?: string;
  qualification?: string;
  profilePic?: string;
  dateOfJoining?: string;
  accountStatus: "active" | "suspended" | "inactive";
  lastLogin?: string;
  roleId: number;
  roleName: string;
}

interface Role {
  id: number;
  name: string;
}

const UserManagement: React.FC = () => {
  const { roleName } = useParams();  // Get roleName from the URL
  const [userData, setUserData] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [formData, setFormData] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const getToken = () => localStorage.getItem("authToken");

  // Fetch users and roles, filtering by the roleName in the URL
  const fetchUsersAndRoles = async (roleName: string) => {
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in.");
      return;
    }

    try {
      // Fetching users
      const userResponse = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.data && Array.isArray(userResponse.data.Users)) {
        const filteredUsers = userResponse.data.Users.filter(
          (user: { role: any; roleName: string }) =>
            user.role.name.toLowerCase() === roleName.toLowerCase() // Filter by dynamic roleName
        );
        setUserData(filteredUsers);
        console.log(`Filtered users for role ${roleName}:`, filteredUsers);
      } else {
        console.error("Unexpected data format:", userResponse.data);
        toast.error("Unexpected response format from the server.");
      } 

      // Fetching roles
      const roleResponse = await axios.get("/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(roleResponse.data); // Set available roles
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch users or roles.");
    } 
  };

  useEffect(() => {
    if (roleName) {
      fetchUsersAndRoles(roleName);  // Fetch filtered users for the role
    }
  }, [roleName]); 

  // Column Definitions for AgGridReact
  const colDefs: ColDef[] = [
    { headerName: "First Name", field: "firstName" },
    { headerName: "Last Name", field: "lastName" },
    { headerName: "Email", field: "email" },
    { headerName: "Role", field: "role.name" },
    {
      headerName: "Date of Birth",
      field: "dateOfBirth",
      valueFormatter: (params) =>
        params.value ? format(new Date(params.value), "yyyy-MM-dd") : "",
    },
    { headerName: "Phone Number", field: "phoneNumber" },
    { headerName: "Address", field: "address" },
    { headerName: "Qualification", field: "qualification" },
    {
      headerName: "Date of Joining",
      field: "dateOfJoining",
      valueFormatter: (params) =>
        params.value ? format(new Date(params.value), "yyyy-MM-dd") : "",
    },
    { headerName: "Account Status", field: "accountStatus" },
    { headerName: "Last Login", field: "lastLogin" },
    {
      headerName: "Actions",
      editable: false,
      field: "actions",
      cellRenderer: (params: { data: User }) => {
        const { data } = params;
        return (
          <div className="flex space-x-2">
            <Button
              onClick={() => handleEditClick(data)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => confirmDeleteUser(data)}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-700"
            >
              <Trash className="h-5 w-5" />
            </Button>
          </div>
        );
      },
    },
  ];


  const handleEditClick = (user: User) => {
          setSelectedUser(user);
          setFormData(user);
          setIsModalOpen(true);
        };

        // Handle form field changes
        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
          const { name, value } = e.target;
          setFormData((prev) => prev ? { ...prev, [name]: value } : null);
        };
     
      //edit user
      const editUser = async (userToEdit: User) => {
        if (!formData) {
          toast.error("Form data is missing!");
          return;
        }
     
        // Prepare updated user data with the formData
        const updatedUser = {
          ...userToEdit,
          lastName: formData?.lastName || userToEdit.lastName,
          firstName: formData?.firstName || userToEdit.firstName,
          email: formData?.email || userToEdit.email,
          dateOfBirth: formData?.dateOfBirth,
          phoneNumber: formData?.phoneNumber,
          address: formData?.address,
          qualification: formData?.qualification,
          accountStatus: formData?.accountStatus,
          dateOfJoining: formData?.dateOfJoining
            ? format(new Date(formData.dateOfJoining), "yyyy-MM-dd")
            : userToEdit.dateOfJoining,
        };
     
     
        const token = getToken();
        if (!token) {
          toast.error("Authorization token not found!");
          return;
        }
     
        console.log("Updating user with data:", updatedUser);
     
        axios
          .put(`/users/${userToEdit.id}`, updatedUser, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((response) => {
            console.log("User updated:", response.data);
            setUserData((prevData) =>
              prevData.map((user) =>
                user.id === userToEdit.id ? { ...user, ...updatedUser } : user
              )
            );
            toast.success("User updated successfully!");
            setSelectedUser(null);
            setIsModalOpen(false); // Optionally close the edit form here
          })
          .catch((error) => {
            console.error("Error updating user:", error);
            toast.error(error.response?.data?.message || "Failed to update user.");
          });
      };

  // Function to open the delete confirmation modal
  const confirmDeleteUser = (data: User) => {
    const user = userData.find((user) => user.id === data.id);
    if (user) {
      setUserToDelete(user);
      setIsDeleteModalOpen(true);
    }
  };  
  

  // Function to handle the actual deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to delete a user.");
      return;
    }

    try {
      await axios.delete(`/users/${userToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData((prev) => prev.filter((user) => user.id !== userToDelete.id));
      toast.success("Role deleted successfully!");
    } catch (error) {
      console.error("Failed to delete role", error);
      toast.error("Failed to delete the role. Please try again later.");
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Cancel the deletion
  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };


  return (
        <div className="flex-1 p-4 mt-5 ml-20 w-[1200px]">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg mb-6">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold tracking-wide">{roleName? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase(): ''} Management</h2>
              <p className="text-sm font-light">
                Easily manage {roleName}. Edit, or delete {roleName} records with ease.
              </p>
            </div>
          </div>
     
           {/* Edit Form - Conditional Rendering */}
           {selectedUser && (
            <div className="bg-white p-4 rounded shadow-md mb-6">
              <h3 className="text-xl font-bold mb-4">Edit User</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  editUser(formData!); // Ensure formData is not null
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData?.firstName || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData?.lastName || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData?.email || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Role</label>
                  <select
                    name="roleId"
                    value={formData?.roleId || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData?.dateOfBirth || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">PhoneNumber</label>
                  <input
                    type="number"
                    name="phoneNumber"
                    value={formData?.phoneNumber || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData?.address || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData?.qualification || ""}
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium">Account Status</label>
                  <select
                    name="accountStatus"
                    value={formData?.accountStatus || "active"} // Default to "active"
                    onChange={handleInputChange}
                    className="border p-2 rounded w-full"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

{isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-auto">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete the user details for</p>
            <span className="font-bold">{roleName? roleName.charAt(0).toUpperCase() + roleName.slice(1).toLowerCase(): ''}
            </span>?
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                onClick={handleCancelDelete}
                className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
     
          <div
            className="ag-theme-quartz text-left"
            style={{ height: "calc(100vh - 180px)", width: "100%" }}
          >
            <AgGridReact
              rowSelection="multiple"
              suppressRowClickSelection
              suppressMovableColumns
              loading={userData.length === 0}
              columnDefs={colDefs}
              rowData={userData}
              defaultColDef={{
                editable: false,
                sortable: true,
                filter: true,
                resizable: true,
              }}
              animateRows
            />
          </div>
        </div>
      );
    };

export default UserManagement;
