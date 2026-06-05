using Microsoft.AspNetCore.SignalR;

namespace fitstation_backend.Hubs
{
    public class ChatHub : Hub
    {
        public async Task SendMessage(int idConversation, string content, int senderId)
        {
            await Clients.Group(idConversation.ToString()).SendAsync("ReceiveMessage", new
            {
                IdSender = senderId,
                Content = content,
                IdConversation = idConversation,
                CreatedAt = DateTime.Now
            });
        }

        public async Task JoinConversation(int idConversation)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, idConversation.ToString());
        }

        public async Task LeaveConversation(int idConversation)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, idConversation.ToString());
        }
    }
}