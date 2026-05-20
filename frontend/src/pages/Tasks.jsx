import { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const sampleTables = [
  { id: 1, capacity: 2, location: 'Indoor', status: 'Available' },
  { id: 2, capacity: 4, location: 'Indoor', status: 'Occupied' },
  { id: 3, capacity: 4, location: 'Indoor', status: 'Available' },
  { id: 4, capacity: 6, location: 'Indoor', status: 'Reserved' },
  { id: 5, capacity: 2, location: 'Indoor', status: 'Available' },
  { id: 6, capacity: 4, location: 'Indoor', status: 'Occupied' },
  { id: 7, capacity: 4, location: 'Indoor', status: 'Available' },
  { id: 8, capacity: 6, location: 'Indoor', status: 'Reserved' },
];

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axiosInstance.get('/api/tasks', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setTasks(response.data);
      } catch (error) {
        alert('Failed to fetch tasks.');
      }
    };

    fetchTasks();
  }, [user]);

  const tables = tasks.length
    ? tasks.map((task, index) => ({
        id: index + 1,
        capacity: task.title || '4',
        location: task.description || 'Indoor',
        status: task.deadline ? 'Reserved' : 'Available',
      }))
    : sampleTables;

  return (
    <main className="restaurant-page px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-stone-950">Manage Tables</h1>
            <p className="mt-4 text-xl text-stone-700">Add, view, edit or delete restaurant tables</p>
          </div>
          <button type="button" className="restaurant-button w-full md:w-[323px]">
            Add Table
          </button>
        </div>

        <div className="restaurant-admin-table">
          <div className="restaurant-admin-row restaurant-admin-head">
            <span>Table Number</span>
            <span>Capacity</span>
            <span>Location</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {tables.map((table) => (
            <div key={table.id} className="restaurant-admin-row">
              <span>{table.id}</span>
              <span>{table.capacity}</span>
              <span>{table.location}</span>
              <span>{table.status}</span>
              <span className="flex gap-2">
                <button type="button" className="restaurant-icon-button" aria-label="Edit table">
                  Edit
                </button>
                <button
                  type="button"
                  className="restaurant-icon-button restaurant-danger-button"
                  aria-label="Delete table"
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Tasks;
