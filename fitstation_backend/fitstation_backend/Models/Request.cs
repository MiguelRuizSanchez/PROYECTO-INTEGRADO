using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models
{
    [Table("worker_requests")] // 🚀 REPARADO: Apunta directamente a la tabla vinculada con tus sesiones
    public class Request
    {
        [Key]
        [Column("id_request")]
        public int IdRequest { get; set; }

        [Column("id_client")]
        public int IdClient { get; set; }

        [Column("id_worker")]
        public int IdWorker { get; set; }

        [Column("requested_date")]
        public DateTime RequestedDate { get; set; }

        [Column("requested_time")]
        public string RequestedTime { get; set; } = string.Empty;

        [Column("status")]
        public string Status { get; set; } = "Pending";
    }
}