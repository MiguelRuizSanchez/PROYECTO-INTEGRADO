import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
//para poner el navbar de arriba no hay por ahora
// import { NavbarComponent } from '../navbar/navbar';
//esto es una llamada a una funcion del backend para que se publiquen las publicaciones; todavia no existe
// import { PostService } from '../../services/post.service';

@Component({
  //cambiar al nombre de la funcion en el backend
  selector: 'app-feed',
  standalone: true,
  // para que este el navbar arriba, junto a los link de las paginas
  imports: [CommonModule, NavbarComponent, RouterLink, FormsModule],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css']
})
// llamada del backend a ala funcion y decir cual es y como es
export class FeedComponent implements OnInit {
  isLoggedIn: boolean = false;
  nuevoPost: string = '';
  posts: any[] = [];
  isAdmin: boolean = false;
  myId: number = 0;
  isLoading: boolean = true;

  // para cargar desde el backend
  constructor(private postService: PostService, private cdr: ChangeDetectorRef) {}

  // esto es una llamada el backend para ver quien inicia sesion y ver una cosa o otra
  ngOnInit() {
    this.checkUserRole();
    this.cargarMuro();
  }
// la funcion para ver el rol (el rol se debe selecionar desde el register y la consulta en la basee de datos )
  checkUserRole() {
    const token = localStorage.getItem('token');
    if (token) {
      this.isLoggedIn = true;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.myId = parseInt(payload.id || payload.nameid || '0');
        const role = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
        this.isAdmin = (role.toLowerCase() === 'admin');
      } catch (e) {
        console.error("Error decodificando el token", e);
      }
    } else {
      this.isLoggedIn = false;
    }
  }
// comprobar ya que a mi no me cargaba a veces

  cargarMuro() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
        this.cdr.detectChanges(); // Despierta Angular
      },
      error: (err: any) => {
        console.error('Error cargando el muro', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // para publicar post, llamada al backend

  publicar() {
    if (!this.nuevoPost || !this.nuevoPost.trim()) return;

    this.postService.createPost(this.nuevoPost).subscribe({
      next: () => {
        this.nuevoPost = '';
        this.cargarMuro();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al publicar', err)
    });
  }

  // para publicar post, llamada al backend
  borrarPost(idPost: number) {
    if (confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
      this.postService.deletePost(idPost).subscribe({
        next: () => {
          this.posts = this.posts.filter(p => p.idPost !== idPost);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error("Error al borrar", err);
          alert("Hubo un error o no tienes permisos para borrar este post.");
        }
      });
    }
  }
}
