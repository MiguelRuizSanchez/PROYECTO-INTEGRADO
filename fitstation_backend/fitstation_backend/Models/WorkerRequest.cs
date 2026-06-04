using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models
{
    [Table("worker_requests")]
    public class WorkerRequest
    {
        [Key]
        [Column("id_request")]
        public int IdRequest { get; set; }

        [Column("id_client")]
        public int IdClient { get; set; }

        [Column("id_worker")]
        public int IdWorker { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Pending";

        [Column("request_date")]
        public DateTime RequestDate { get; set; } = DateTime.Now;

        [Column("requested_day")]
        public string? RequestedDay { get; set; }

        [Column("requested_time")]
        public TimeSpan? RequestedTime { get; set; }
    }
}