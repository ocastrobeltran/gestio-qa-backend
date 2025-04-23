// Controlador simple para comentarios

// Añadir un comentario a un proyecto
exports.addComment = (req, res) => {
    const projectId = req.params.id;
    const { comment_text } = req.body;
    
    // En una implementación real, aquí guardarías el comentario en la base de datos
    
    res.status(201).json({
      status: 'success',
      data: {
        comment: {
          id: Math.floor(Math.random() * 1000), // ID aleatorio para simular
          project_id: projectId,
          user_id: req.user ? req.user.id : 1, // Simulamos un usuario
          comment_text,
          created_at: new Date().toISOString()
        }
      }
    });
  };
  
  // Obtener comentarios de un proyecto
  exports.getProjectComments = (req, res) => {
    const projectId = req.params.id;
    
    // En una implementación real, aquí consultarías los comentarios de la base de datos
    
    res.status(200).json({
      status: 'success',
      data: {
        comments: [
          {
            id: 1,
            project_id: projectId,
            user_id: 1,
            comment_text: 'Este es un comentario de ejemplo',
            created_at: new Date().toISOString()
          }
        ]
      }
    });
  };