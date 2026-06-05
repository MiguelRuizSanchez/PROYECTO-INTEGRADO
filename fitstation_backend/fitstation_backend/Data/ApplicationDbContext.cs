using Microsoft.EntityFrameworkCore;
using fitstation_backend.Models;

namespace fitstation_backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        //TABLAS
        public DbSet<User> Users { get; set; }
        public DbSet<Worker> Workers { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Session> Sessions { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<Routine> Routines { get; set; }
        public DbSet<RoutineExercise> RoutineExercises { get; set; }
        public DbSet<ClientRoutine> ClientRoutines { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<ConversationUser> ConversationUsers { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<WorkerRequest> WorkerRequests { get; set; }

        // RELACIÓN DE LAS TABLAS
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Worker>().ToTable("workers");
            modelBuilder.Entity<Client>().ToTable("clients");
            modelBuilder.Entity<Class>().ToTable("classes");
            modelBuilder.Entity<Booking>().ToTable("bookings");
            modelBuilder.Entity<Session>().ToTable("sessions");

            modelBuilder.Entity<Exercise>().ToTable("exercises");
            modelBuilder.Entity<Conversation>().ToTable("conversations");
            modelBuilder.Entity<ConversationUser>(entity =>
            {
                entity.ToTable("conversation_users");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.IdConversation).HasColumnName("id_conversation");
                entity.Property(e => e.IdWorker).HasColumnName("id_worker");
                entity.Property(e => e.IdClient).HasColumnName("id_client");
            });
            modelBuilder.Entity<Message>().ToTable("messages");

            modelBuilder.Entity<WorkerRequest>().ToTable("worker_requests");
            modelBuilder.Entity<ClientRoutine>().ToTable("client_routines"); 

            modelBuilder.Entity<Routine>(entity =>
            {
                entity.ToTable("routines");
                entity.HasKey(e => e.IdRoutine);
                entity.Property(e => e.IdRoutine).HasColumnName("id_routine");
                entity.Property(e => e.IdWorker).HasColumnName("id_worker");
                entity.Property(e => e.Name).HasColumnName("name");
                entity.Property(e => e.Description).HasColumnName("description");
            });

            modelBuilder.Entity<RoutineExercise>(entity =>
            {
                entity.ToTable("routine_exercises");
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.IdRoutine).HasColumnName("id_routine");
                entity.Property(e => e.IdExercise).HasColumnName("id_exercise");
                entity.Property(e => e.Reps).HasColumnName("reps");
                entity.Property(e => e.Sets).HasColumnName("sets");
            });
        }
    }
}