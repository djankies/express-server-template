// Example model file
// You can use any ORM (Sequelize, Mongoose, etc.) or raw SQL queries here

export class Example {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  // Example static method to find by ID
  static async findById(_id) {
    // Implement database query logic here
    return null;
  }

  // Example instance method to save
  async save() {
    // Implement save logic here
    return this;
  }
}
