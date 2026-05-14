using Microsoft.EntityFrameworkCore;
using fitstation_backend.Models;

namespace fitstation_backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // --- 1. TABLAS DE IDENTIDAD Y SISTEMA (MANTENIDAS) ---
    public DbSet<User> Users { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Worker> Workers { get; set; }
    
    // --- 2. TABLAS DE GESTIÓN Y SESIONES (MANTENIDAS) ---
    public DbSet<WorkerRequest> WorkerRequests { get; set; }
    public DbSet<Session> Sessions { get; set; }
    
    // --- 3. TABLAS DE CHAT (MANTENIDAS) ---
    public DbSet<Conversation> Conversations { get; set; }
    public DbSet<ConversationUser> ConversationUsers { get; set; }
    public DbSet<Message> Messages { get; set; }

    // --- 4. TABLAS DE ENTRENAMIENTO (UNIFICADAS Y SIN DUPLICADOS) ---
    // He eliminado las repeticiones para solucionar el error CS0102
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<Routine> Routines { get; set; }
    public DbSet<RoutineExercise> RoutineExercises { get; set; }
    public DbSet<ClientRoutine> ClientRoutines { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Mantenemos la lógica de creación original
    }
}