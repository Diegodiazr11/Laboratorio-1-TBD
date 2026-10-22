export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <p>© 2026 ArriendosTurismo.Todos los derechos reservados.</p>
        <div className="flex gap-6 font-medium text-gray-600">
          <a href="#" className="hover:text-gray-900 transition-colors">Privacidad</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Términos y Condiciones</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Soporte</a>
        </div>
      </div>
    </footer>
  );
}