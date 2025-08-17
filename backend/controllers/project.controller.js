import projectModel from "../models/project.model.js";
import { validationResult } from "express-validator";

/**
 * Create a new project
 */
export const createProject = async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name } = req.body;

        // check if project with same name already exists
        const existing = await projectModel.findOne({ name });
        if (existing) {
            return res.status(400).json({ error: "Project name already exists" });
        }

        // create project with logged-in user as owner
        const project = await projectModel.create({
            name,
            users: [req.user._id],
        });

        res.status(201).json({ project });
    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get all projects for the logged-in user
 */
export const getProjects = async(req, res) => {
    try {
        const projects = await projectModel
            .find({ users: req.user._id })
            .populate("users", "email");

        res.status(200).json({ projects });
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Add users to a project
 */
export const addUserToProject = async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, users } = req.body;

        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        // push new users, avoid duplicates
        users.forEach((user) => {
            if (!project.users.includes(user)) {
                project.users.push(user);
            }
        });

        await project.save();

        res.status(200).json({ project });
    } catch (error) {
        console.error("Error adding user to project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Get project by ID
 */
export const getProjectById = async(req, res) => {
    try {
        const { projectId } = req.params;

        const project = await projectModel
            .findById(projectId)
            .populate("users", "email");

        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        res.status(200).json({ project });
    } catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Update file tree of a project
 */
export const updateFileTree = async(req, res) => {
    try {
        const { projectId, fileTree } = req.body;

        const project = await projectModel.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Project not found" });
        }

        project.fileTree = fileTree;
        await project.save();

        res.status(200).json({ project });
    } catch (error) {
        console.error("Error updating file tree:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};