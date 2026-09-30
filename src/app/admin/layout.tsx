// El admin usa el amarillo de la landing (identidad del catálogo) como color
// de acento en lugar del naranja del resto del sitio. `contents` hace que
// este contenedor no afecte el layout: solo aporta las variables de color.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-theme contents">{children}</div>;
}
