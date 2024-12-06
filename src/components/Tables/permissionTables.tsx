import { Button } from "../../components/ui/button";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Edit, Trash } from "lucide-react";
import axios from "axios";

// TypeScript types for the component props
interface PermissionTableProps {
  editable?: boolean;
}

// TypeScript types for permission data
interface PermissionData {
  id: number;
  action: string;
  description: string;
  groupName: string;
}

// Column definitions type from AG-Grid
import { ColDef } from "ag-grid-community";

// Helper to get token
const getToken = () => localStorage.getItem("authToken");

const ManagePermissions = ({ editable = true }: PermissionTableProps) => {
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPermission, setNewPermission] = useState<PermissionData>({
    id: 0,
    action: "",
    description: "",
    groupName: "",
  });

  // Fetch permissions
  const fetchPermissions = async () => {
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to view permissions.");
      return;
    }

    try {
      const response = await axios.get(`/auth/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Fetched permissions:", response.data);
      setPermissions(response.data.permissions || []);
    } catch (error) {
      console.error("Failed to fetch permissions", error);
      toast.error("Failed to fetch permissions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const addNewPermission = () => {
    setEditing(false);
    setNewPermission({
      id: 0,
      action: "",
      description: "",
      groupName: "",
    });
    setIsModalOpen(true);
  };

  const deletePermission = async (data: any) => {
    const token = getToken();
    if (!token) {
      toast.error("You must be logged in to delete a permission.");
      return;
    }

    const permissionId = data.data.id;
    try {
      await axios.delete(`/auth/permissions/${permissionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPermissions((prev) => prev.filter((permission) => permission.id !== permissionId));
      toast.success("Permission deleted successfully!");
    } catch (error) {
      console.error("Failed to delete permission", error);
      toast.error("Failed to delete the permission. Please try again later.");
    }
  };

  const editPermission = (data: any) => {
    const permissionToEdit = permissions.find((permission) => permission.id === data.data.id);
    console.log("Permission to edit:", permissionToEdit);
    if (permissionToEdit) {
      setEditing(true);
      setNewPermission(permissionToEdit);
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setNewPermission({
      id: 0,
      action: "",
      description: "",
      groupName: "",
    });
  };

  const handleFormSubmit = async () => {
    const token = getToken();

    if (!token) {
      toast.error("You must be logged in to perform this action.");
      return;
    }

    if (editing) {
      if (!newPermission.id) {
        console.error("Permission ID is missing for update.");
        toast.error("Permission ID is missing.");
        return;
      }

      try {
        const response = await axios.put(`/auth/permissions/${newPermission.id}`, newPermission, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const updatedPermission = response.data;
        setPermissions((prev) =>
          prev.map((permission) =>
            permission.id === newPermission.id ? updatedPermission : permission
          )
        );

        toast.success("Permission updated successfully!");
      } catch (error) {
        console.error("Failed to update permission", error);
        toast.error("Failed to update the permission. Please try again later.");
      }
    } else {
      try {
        const response = await axios.post(`/auth/permissions`, newPermission, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const newPermissionData = response.data;
        setPermissions((prev) => [...prev, newPermissionData]);
        toast.success("Permission added successfully!");
      } catch (error) {
        console.error("Failed to add permission", error);
        toast.error("Failed to add the permission. Please try again later.");
      }
    }

    await fetchPermissions();
    handleModalClose();
  };

  useEffect(() => {
    setColDefs([
      { headerName: "Action", field: "action", editable: false, width: 150 },
      { headerName: "Description", field: "description", editable: false, width: 500 },
      { headerName: "Group Name", field: "groupName", editable: false, width: 200 },
      {
        headerName: "Actions",
        field: "actions",
        width: 200,
        cellRenderer: (params: any) => (
          <div className="flex space-x-2">
            <Button
              onClick={() => editPermission(params)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => deletePermission(params)}
              className="bg-red-500 text-white p-2 rounded hover:bg-red-700"
            >
              <Trash className="h-5 w-5" />
            </Button>
          </div>
        ),
        editable: false,
      },
    ]);
  }, [permissions]);

  return (
    <div className="flex-1 p-4 mt-10 ml-10">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-purple-500 to-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg mb-6 w-[850px]">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold tracking-wide">Permissions</h2>
          <p className="text-sm font-light">Manage permissions easily.</p>
        </div>
        <Button
          onClick={addNewPermission}
          className="bg-yellow-400 text-gray-900 font-semibold px-5 py-2 rounded-md shadow-lg hover:bg-yellow-500 transition duration-300"
        >
          + New Permission
        </Button>
      </div>

      <div className="ag-theme-quartz text-left" style={{ height: "calc(100vh - 180px)", width: "68%" }}>
        <AgGridReact
          rowSelection="multiple"
          suppressRowClickSelection
          suppressMovableColumns
          loading={loading}
          columnDefs={colDefs}
          rowData={permissions}
          defaultColDef={{ editable, sortable: true, filter: true, resizable: true }}
          animateRows
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit Permission" : "Add New Permission"}</h2>
            <form>
              <div className="mb-4">
                <label className="block font-medium">Action</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={newPermission.action}
                  onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Description</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={newPermission.description}
                  onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block font-medium">Group Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={newPermission.groupName}
                  onChange={(e) => setNewPermission({ ...newPermission, groupName: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={handleModalClose}
                  className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleFormSubmit}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePermissions;
    