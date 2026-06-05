using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace fitstation_backend.Models
{
    [Table("bookings")]
    public class Booking
    {
        [Key]
        [Column("id_booking")]
        public int IdBooking { get; set; }

        [Column("id_client")]
        public int IdClient { get; set; }

        [Column("id_class")]
        public int IdClass { get; set; }

        [Column("id_service")]
        public int? IdService { get; set; }

        [Column("booking_date")]
        public DateTime BookingDate { get; set; }

        [Column("status")]
        public string Status { get; set; } = "Pending"; 
    }
}