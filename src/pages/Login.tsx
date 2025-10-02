import React, { useState } from 'react';
import { Bus, Lock, Mail, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password
        });

        if (signUpError) throw signUpError;

        setSuccess('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setIsSignUp(false);
        setPassword('');
      } else {
        const success = await login(email, password);
        if (!success) {
          setError('Credenciales incorrectas. Inténtalo de nuevo.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-white shadow-lg">
            <Bus className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            BusControl System
          </h2>
          <p className="mt-2 text-center text-sm text-blue-200">
            {isSignUp ? 'Crea tu cuenta' : 'Inicia sesión en tu cuenta'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...') : (isSignUp ? 'Crear cuenta' : 'Iniciar sesión')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccess('');
              }}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-white text-sm font-medium rounded-lg text-white hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors duration-200"
            >
              {isSignUp ? (
                <>
                  <Lock className="h-4 w-4" />
                  Ya tengo cuenta
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Crear nueva cuenta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;