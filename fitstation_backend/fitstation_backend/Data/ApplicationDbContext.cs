using Microsoft.EntityFrameworkCore;
using fitstation_backend.Models;

namespace fitstation_backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Worker> Workers { get; set; }
    public DbSet<WorkerRequest> WorkerRequests { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationUser> ConversationUsers { get; set; }
    public DbSet<Message> Messages { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<Routine> Routines { get; set; }
    public DbSet<RoutineExercise> RoutineExercises { get; set; }
    
    // 🚀 NUEVO: Registramos la tabla de relación entre clientes y rutinas
    public DbSet<ClientRoutine> ClientRoutines { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // No es necesario configurar claves compuestas aquí porque usamos [Key] en el modelo Id
    }
}