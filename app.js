const express = require("express");
const morgan = require("morgan");
const fs = require("fs");

const filePath = "./tasks.json";

const app = express();
app.use(express.json());
app.use(morgan("dev"));

let tasks = [];

//health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is up and running" });
});

//  load tasks from JSON
const loadTasksFromFile = () => {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  }
  return [];
};

// save tasks to JSON
const saveTasks = (tasks) => {
  fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
};

tasks = loadTasksFromFile();

let taskId =
  tasks.length > 0 ? Math.max(...tasks.map((task) => task.id)) + 1 : 1;

// create task and save to JSON
app.post("/tasks", (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Title and description are required" });
  }
  const task = {
    id: taskId,
    title,
    description,
    status: "pending",
  };
  tasks.push(task);
  saveTasks(tasks);
  res.status(201).json({
    message: "Task created successfully",
    task,
  });
});

// get all tasks
app.get("/tasks", (req, res) => {
  res.status(200).json({
    message: "Task created successfully",
    count: tasks.length,
    tasks: tasks,
  });
});

// update status of a an existing task
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const taskIndex = tasks.findIndex((t) => t.id === parseInt(id));
  if (!taskIndex) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (status !== "pending" && status !== "completed") {
    return res.status(400).json({ error: "Invalid status" });
  }
  let task = tasks[taskIndex];
  task.status = status;
  // save to JSON
  saveTasks(tasks);
  res.status(200).json({
    message: "Task status changed successfully",
    task: task,
  });
});

// update a task
app.put("/tasks/:id/update", (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  const taskIndex = tasks.findIndex((t) => t.id === parseInt(id));
  if (!taskIndex) {
    return res.status(404).json({ error: "Task not found" });
  }
  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Title and description are required" });
  }
  
  if (tasks[taskIndex].status === "completed") {
    return res.status(400).json({ error: "Task cannot be upated as it has been completed" });
  }
  let task = tasks[taskIndex];
  task.title = title;
  task.description = description;
  // save to JSON
  saveTasks(tasks);
  res.status(200).json({
    message: "Task updated successfully",
    task: task,
  });
});

// delete a task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex((t) => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  tasks.splice(taskIndex, 1);
  // save to JSON
  saveTasks(tasks);
  res.status(200).json({ message: "Task deleted successfully" });
});

// filter tasks by status
app.get("/tasks/status/:status", (req, res) => {
  const { status } = req.params;
  if (status !== "pending" && status !== "completed") {
    return res.status(400).json({ error: "Invalid status" });
  }
  const filteredTasks = tasks.filter((t) => t.status === status);
  res.status(200).json({
    message: `Tasks with status ${status} fetched successfully`,
    count: filteredTasks.length,
    tasks: filteredTasks,
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
