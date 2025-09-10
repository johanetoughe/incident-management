import React, { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LogOut, 
  Plus, 
  AlertCircle, 
  ShoppingCart, 
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

// Configuration Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

// Context d'authentification
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider d'authentification
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, service) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  
  if (!error && data.user) {
    // Créer le profil manuellement après la création de l'utilisateur
    await supabase
      .from('profiles')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        service: service,
        role: 'user'
      }]);
  }
  
  return { data, error };
};

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

// Composant d'authentification
const AuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signIn } = useAuth();

  const services = [
    'IT', 'RH', 'Infirmerie', 'Médecin', 'Accueil et facturation',
    'Direction', 'Laboratoire', 'Comptabilité', 'Cotation', 'Stock', 'Trésorerie et caisse'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (!service) {
          setError('Veuillez sélectionner un service');
          return;
        }
        const { error } = await signUp(email, password, service);
        if (error) throw error;
        alert('Compte créé avec succès ! Vérifiez votre email.');
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </h2>
        </div>
        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Service</label>
              <select
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sélectionnez un service</option>
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isSignUp ? 'Créer le compte' : 'Se connecter')}
          </button>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour créer une demande
const CreateRequest = ({ onClose, onSuccess }) => {
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('basse');
  const [serviceDemandeur, setServiceDemandeur] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const incidentCategories = [
    'Problème d\'imprimante', 'Demande liée à Santymed', 'Problème de réseau',
    'Demande liée à Q-Gabon', 'Problème de fiches de paillasses', 'Problème au niveau des automates',
    'Problème Pack Office', 'Problème Call Center', 'Demande de maintenance d\'ordinateur',
    'Problème lié au téléphone de service', 'Demande de création de compte Gmail', 'Autre demande'
  ];

  const orderCategories = [
    'Commander un ordinateur', 'Commander un clavier', 'Commander une souris',
    'Commander un cable USB pour imprimante', 'Commander une imprimante', 'Autre commande'
  ];

  const services = [
    'IT', 'RH', 'Infirmerie', 'Médecin', 'Accueil et facturation',
    'Direction', 'Laboratoire', 'Comptabilité', 'Cotation', 'Stock', 'Trésorerie et caisse'
  ];

  const handleSubmit = async () => {
    if (!type || !title || !description || !location || !serviceDemandeur) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('requests')
        .insert([{
          user_id: profile.id,
          type,
          title,
          description,
          location,
          priority,
          service_demandeur: serviceDemandeur
        }]);

      if (error) throw error;
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Nouvelle demande</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de demande</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCategory('');
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un type</option>
              <option value="incident">Incident</option>
              <option value="order">Commande</option>
            </select>
          </div>

          {type && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Sélectionnez une catégorie</option>
                {(type === 'incident' ? incidentCategories : orderCategories).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Titre de la demande</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description détaillée</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Localisation</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priorité</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Service demandeur</label>
            <select
              value={serviceDemandeur}
              onChange={(e) => setServiceDemandeur(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un service</option>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer la demande'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant pour afficher les demandes
const RequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { profile } = useAuth();

  const isITOrAdmin = profile?.role === 'it_member' || profile?.role === 'admin';

  useEffect(() => {
    fetchRequests();
  }, [filter, profile]);

  const fetchRequests = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let query = supabase.from('requests').select(`
        *,
        profiles!requests_user_id_fkey(email, service),
        assigned_profile:profiles!requests_assigned_to_fkey(email, service)
      `).order('created_at', { ascending: false });

      // Filtrage selon le rôle
      if (!isITOrAdmin) {
        query = query.eq('user_id', profile.id);
      } else if (filter === 'assigned') {
        query = query.eq('assigned_to', profile.id);
      } else if (filter === 'unassigned') {
        query = query.is('assigned_to', null);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const takeRequest = async (requestId) => {
    try {
      const { data, error } = await supabase.rpc('assign_request_to_self', {
        request_id: requestId
      });

      if (error) throw error;
      
      if (data) {
        fetchRequests();
        alert('Demande prise en charge avec succès !');
      } else {
        alert('Impossible de prendre cette demande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la prise en charge');
    }
  };

  const closeRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from('requests')
        .update({ 
          status: 'termine',
          closed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      fetchRequests();
      alert('Demande clôturée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la clôture');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ouvert':
        return React.createElement(AlertCircle, { className: "w-5 h-5 text-red-500" });
      case 'en_cours':
        return React.createElement(Clock, { className: "w-5 h-5 text-yellow-500" });
      case 'termine':
        return React.createElement(CheckCircle, { className: "w-5 h-5 text-green-500" });
      default:
        return React.createElement(AlertCircle, { className: "w-5 h-5 text-gray-500" });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgente':
        return 'text-red-600 bg-red-100';
      case 'moyenne':
        return 'text-yellow-600 bg-yellow-100';
      case 'basse':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {isITOrAdmin && (
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Toutes
          </button>
          <button
            onClick={() => setFilter('unassigned')}
            className={`px-4 py-2 rounded-md ${filter === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Non assignées
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`px-4 py-2 rounded-md ${filter === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Mes demandes
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Aucune demande trouvée</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white border rounded-lg p-4 shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(request.status)}
                    <h3 className="text-lg font-semibold">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {request.type === 'incident' ? 
                        React.createElement(AlertTriangle, { className: "w-4 h-4" }) : 
                        React.createElement(ShoppingCart, { className: "w-4 h-4" })
                      }
                      {request.type === 'incident' ? 'Incident' : 'Commande'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{request.description}</p>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>📍 {request.location}</div>
                    <div>🏢 Service: {request.service_demandeur}</div>
                    <div>👤 Demandeur: {request.profiles?.email}</div>
                    {request.assigned_profile && (
                      <div>⚡ Assigné à: {request.assigned_profile.email}</div>
                    )}
                    <div>📅 Créé le: {new Date(request.created_at).toLocaleString()}</div>
                  </div>
                </div>
                
                {isITOrAdmin && (
                  <div className="ml-4 space-y-2">
                    {request.status === 'ouvert' && !request.assigned_to && (
                      <button
                        onClick={() => takeRequest(request.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Prendre
                      </button>
                    )}
                    {request.status === 'en_cours' && (request.assigned_to === profile.id || profile.role === 'admin') && (
                      <button
                        onClick={() => closeRequest(request.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Clôturer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Composant principal Dashboard
const Dashboard = () => {
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { signOut, profile } = useAuth();

  const handleCreateSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Gestion d'incidents</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {profile?.email} ({profile?.service})
                {(profile?.role === 'it_member' || profile?.role === 'admin') && 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {profile?.role === 'admin' ? 'Admin' : 'IT'}
                  </span>
                }
              </span>
              <button
                onClick={() => setShowCreateRequest(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouvelle demande
              </button>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <RequestsList key={refreshTrigger} />
      </main>

      {showCreateRequest && (
        <CreateRequest
          onClose={() => setShowCreateRequest(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

// Composant principal App
const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return user ? React.createElement(Dashboard) : React.createElement(AuthForm);
};

// Composant racine avec Provider
const AppWithProvider = () => {
  return React.createElement(AuthProvider, null, React.createElement(App));
};

export default AppWithProvider;