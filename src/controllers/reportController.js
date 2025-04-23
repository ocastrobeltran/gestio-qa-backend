// Controlador simple para reportes

// Obtener reporte por estado
exports.getProjectsByStatus = (req, res) => {
    // En una implementación real, consultarías los datos de la base de datos
    
    res.status(200).json({
      status: 'success',
      data: {
        statusReport: [
          { status: 'En análisis', count: 2 },
          { status: 'En validación', count: 1 },
          { status: 'En pruebas', count: 3 },
          { status: 'Aprobado', count: 1 }
        ]
      }
    });
  };
  
  // Obtener reporte por analista
  exports.getProjectsByAnalyst = (req, res) => {
    // En una implementación real, consultarías los datos de la base de datos
    
    res.status(200).json({
      status: 'success',
      data: {
        analystReport: [
          { analyst: 'Analista 1', count: 3 },
          { analyst: 'Analista 2', count: 4 }
        ]
      }
    });
  };
  
  // Obtener reporte por cliente
  exports.getProjectsByClient = (req, res) => {
    // En una implementación real, consultarías los datos de la base de datos
    
    res.status(200).json({
      status: 'success',
      data: {
        clientReport: [
          { client: 'Constructora Bolivar', count: 2 },
          { client: 'Banco XYZ', count: 3 },
          { client: 'Empresa ABC', count: 1 }
        ]
      }
    });
  };
  
  // Obtener reporte detallado
  exports.getDetailedReport = (req, res) => {
    // En una implementación real, consultarías los datos de la base de datos con filtros
    
    res.status(200).json({
      status: 'success',
      data: {
        report: [
          {
            id: 1,
            title: 'Bolivar Web',
            client: 'Constructora Bolivar',
            status: 'En pruebas',
            qa_analyst: 'Analista 1',
            created_at: '2023-01-01T12:00:00Z'
          },
          {
            id: 2,
            title: 'Portal Clientes',
            client: 'Banco XYZ',
            status: 'En análisis',
            qa_analyst: 'Analista 2',
            created_at: '2023-02-01T12:00:00Z'
          }
        ]
      }
    });
  };