"use client";
import { useEffect, useState } from "react";
import { supabase }
from "@/lib/supabaseClient";
import { useRouter }
from "next/navigation";
export default function Home() {
    const [contenido, setContenido] = useState("");
    const [imagen, setImagen] = useState("");
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [message, setMessage] = useState<string | null>(null);
    const [usuarioActual, setUsuarioActual] = useState<any>(null);
  // ✅ Comentarios separados por post
    const [comentariosTexto, setComentariosTexto] = useState<{ [key: string]: string }>({});
  // ✅ Usuarios seguidos
    const [siguiendo,setSiguiendo] = useState<string[]>([]);
    const router = useRouter();
  // =========================
  // VERIFICAR LOGIN
  // =========================




  useEffect(() => {




    const checkUser = async () => {




      const {
        data: { user },
      } = await supabase.auth.getUser();




      if (!user) {




        router.push("/login");




        return;
      }




      setUsuarioActual(user);




      await obtenerSeguidos(user.id);




      setLoading(false);




      obtenerPosts();
    };




    checkUser();




  }, [router]);




  // =========================
  // OBTENER SEGUIDOS
  // =========================




  const obtenerSeguidos = async (
    userId: string
  ) => {




    const { data } = await supabase
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", userId);




    if (data) {




      const ids =
        data.map(
          (s: any) => s.seguido_id
        );




      setSiguiendo(ids);
    }
  };




  // =========================
  // CREAR POST
  // =========================




  const crearPost = async () => {




    if (!usuarioActual) return;




    const { error } = await supabase
      .from("publicaciones")
     .insert([
  {
    usuario_id: usuarioActual.id,
    contenido,
    imagen,
  },
]);
setContenido("");
setImagen("");




    if (error) {




      setMessage(error.message);




      return;
    }




    setContenido("");




    obtenerPosts();
  };




  // =========================
  // OBTENER POSTS
  // =========================




  const obtenerPosts = async () => {




    const { data, error } =
      await supabase
        .from("publicaciones")
        .select(`
          *,
         usuarios(
  id,
  nombre_usuario,
  foto_perfil
),
          likes(
            id,
            usuario_id
          ),
          comentarios(
            id,
            contenido,
            usuarios(
              nombre_usuario
            )
          )
        `)
        .order("creado_en", {
          ascending: false,
        });




    if (error) {




      console.log(error);




      return;
    }




    if (data) {




      setPosts(data);
    }
  };




  // =========================
  // DAR LIKE
  // =========================




  const darLike = async (
  postId: string
) => {


  if (!usuarioActual) return;


  const { data: likeExistente } =
    await supabase
      .from("likes")
      .select("id")
      .eq(
        "usuario_id",
        usuarioActual.id
      )
      .eq(
        "publicacion_id",
        postId
      )
      .maybeSingle();


  if (likeExistente) {


    const { error } =
      await supabase
        .from("likes")
        .delete()
        .eq(
          "id",
          likeExistente.id
        );


    if (error) {


      setMessage(
        error.message
      );


      return;
    }


  } else {


    const { error } =
      await supabase
        .from("likes")
        .insert([
          {
            usuario_id:
              usuarioActual.id,
            publicacion_id:
              postId,
          },
        ]);


    if (error) {


      setMessage(
        error.message
      );


      return;
    }
  }


  obtenerPosts();
};




  // =========================
  // COMENTAR
  // =========================




  const comentar = async (
    postId: string
  ) => {




    if (!usuarioActual) return;




    const texto =
      comentariosTexto[postId];




    if (!texto) return;




    const { error } = await supabase
      .from("comentarios")
      .insert([
        {
          usuario_id: usuarioActual.id,
          publicacion_id: postId,
          contenido: texto,
        },
      ]);




    if (error) {




      setMessage(error.message);




      return;
    }




    // ✅ Limpiar SOLO el input de ese post
    setComentariosTexto({
      ...comentariosTexto,
      [postId]: "",
    });




    obtenerPosts();
  };




  // =========================
  // SEGUIR USUARIO
  // =========================




  const seguirUsuario = async (
    seguidoId: string
  ) => {




    if (!usuarioActual) return;




    // ❌ No seguirse a sí mismo
    if (
      usuarioActual.id === seguidoId
    ) {




      setMessage(
        "No puedes seguirte a ti mismo"
      );




      return;
    }




    // ❌ Ya seguido
    if (
      siguiendo.includes(seguidoId)
    ) {




      return;
    }




    const { error } = await supabase
      .from("seguidores")
      .insert([
        {
          seguidor_id: usuarioActual.id,
          seguido_id: seguidoId,
        },
      ]);




    if (error) {




      setMessage(error.message);




      return;
    }




    // ✅ Actualizar estado
    setSiguiendo([
      ...siguiendo,
      seguidoId,
    ]);




    setMessage(
      "✅ Usuario seguido"
    );
  };




  // =========================
  // LOADING
  // =========================




  if (loading) {




    return (




      <p className="text-center mt-10">
        ⏳ Cargando...
      </p>
    );
  }




  // =========================
  // INTERFAZ
  // =========================




 return (
  <div className="home-page">


    <h1 className="feed-title">
      Inicio
    </h1>


    {message && (
      <p className="feed-message">
        {message}
      </p>
    )}


    {/* CREAR POST */}


    <div className="create-post">


      <textarea
        placeholder="¿Qué está pasando?"
        value={contenido}
        onChange={(e) =>
          setContenido(e.target.value)
        }
        className="post-textarea"
      />
        <input
  type="text"
  placeholder="URL de imagen (opcional)"
  value={imagen}
  onChange={(e) =>
    setImagen(e.target.value)
  }
  className="image-input"
/>
      <button
        onClick={crearPost}
        className="publish-button"
      >
        Publicar
      </button>


    </div>
   


    {/* POSTS */}


    <div className="posts-container">


      {posts.map((post) => {


        const yaSeguido =
          siguiendo.includes(
            post.usuarios?.id
          );


        const esMiPerfil =
          usuarioActual?.id ===
          post.usuarios?.id;


          const yaDioLike =
  post.likes?.some(
    (like: any) =>
      like.usuario_id ===
      usuarioActual?.id
  );


        return (


          <div
            key={post.id}
            className="post-card"
          >


            {/* CABECERA */}


          <div className="post-header">


  <div className="user-info">


    <div className="user-avatar">


      {post.usuarios?.foto_perfil ? (


        <img
          src={post.usuarios.foto_perfil}
          alt="Perfil"
          className="user-avatar-image"
        />


      ) : (


        post.usuarios?.nombre_usuario
          ?.charAt(0)
          ?.toUpperCase()


      )}


    </div>


    <h2 className="username">
      @{post.usuarios?.nombre_usuario}
    </h2>


  </div>


  {!esMiPerfil && (


    <button
      onClick={() =>
        seguirUsuario(
          post.usuarios?.id
        )
      }
      disabled={yaSeguido}
      className={
        yaSeguido
          ? "following-button"
          : "follow-button"
      }
    >
      {yaSeguido
        ? "Siguiendo"
        : "Seguir"}
    </button>


  )}


</div>


            {/* CONTENIDO */}


            <p className="post-content">
              {post.contenido}
            </p>
              {post.imagen && (


  <img
    src={post.imagen}
    alt="Publicación"
    className="post-image"
  />


)}
            {/* LIKE */}


           <button
  onClick={() =>
    darLike(post.id)
  }
  className={
    yaDioLike
      ? "following-button"
      : "like-button"
  }
>
  {
    yaDioLike
      ? "💔 Quitar Like"
      : "❤️ Like"
  }
  {" "}
  ({post.likes?.length || 0})
</button>


            {/* COMENTARIOS */}


            <div className="comments-section">


              <h3 className="comments-title">
                Comentarios
              </h3>


              <div className="comment-form">


                <input
                  type="text"
                  placeholder="Escribe un comentario..."
                  value={
                    comentariosTexto[
                      post.id
                    ] || ""
                  }
                  onChange={(e) =>
                    setComentariosTexto({
                      ...comentariosTexto,
                      [post.id]:
                        e.target.value,
                    })
                  }
                  className="comment-input"
                />


                <button
                  onClick={() =>
                    comentar(post.id)
                  }
                  className="comment-button"
                >
                  Comentar
                </button>


              </div>


              {/* LISTA DE COMENTARIOS */}


              <div>


                {post.comentarios?.map(
                  (com: any) => (


                    <div
                      key={com.id}
                      className="comment-card"
                    >


                      <strong>
                        @{com.usuarios?.nombre_usuario}
                      </strong>


                      {" "}
                      {com.contenido}


                    </div>


                  )
                )}


              </div>


            </div>


          </div>


        );
      })}


    </div>


  </div>
);
}
