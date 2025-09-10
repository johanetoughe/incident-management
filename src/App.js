/* eslint-disable no-unused-vars */
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

// Import du CSS
import './styles.css';

// Configuration Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
  console.warn('⚠️  Variables d\'environnement Supabase non configurées');
}

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
    // Timeout de sécurité pour éviter le chargement infini
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Timeout de chargement - déblocage forcé');
      setLoading(false);
    }, 15000); // 15 secondes max

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
      clearTimeout(loadingTimeout);
    }).catch((error) => {
      console.error('❌ Erreur getSession:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
      clearTimeout(loadingTimeout);
    };
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
      await supabase
        .from('profiles')
        .update({ service })
        .eq('id', data.user.id);
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
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isSignUp ? '✨ Créer un compte' : '🔐 Se connecter'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">📧 Adresse email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control"
              placeholder="votre.email@centre-diagnostic.com"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">🔒 Mot de passe</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              placeholder="Votre mot de passe"
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">🏢 Service</label>
              <select
                required
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="form-control"
              >
                <option value="">Sélectionnez votre service</option>
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="error-message">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? '⏳ Chargement...' : (isSignUp ? '✨ Créer le compte' : '🚀 Se connecter')}
          </button>

          <div className="auth-toggle">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
            </button>
          </div>
        </form>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🎫 Nouvelle demande</h2>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">📋 Type de demande</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setCategory('');
                }}
                className="form-control"
                required
              >
                <option value="">Sélectionnez un type</option>
                <option value="incident">🚨 Incident technique</option>
                <option value="order">🛒 Commande matériel</option>
              </select>
            </div>

            {type && (
              <div className="form-group">
                <label className="form-label">🏷️ Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                  required
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {(type === 'incident' ? incidentCategories : orderCategories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">📝 Titre de la demande</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                placeholder="Résumé court du problème ou besoin"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">📄 Description détaillée</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control form-textarea"
                placeholder="Décrivez en détail votre problème ou besoin..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">📍 Localisation</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="form-control"
                placeholder="Bureau, étage, service..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">🚦 Niveau de priorité</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="form-control"
              >
                <option value="basse">🟢 Basse - Pas urgent</option>
                <option value="moyenne">🟡 Moyenne - Assez important</option>
                <option value="urgente">🔴 Urgente - Bloquant</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">🏢 Service demandeur</label>
              <select
                value={serviceDemandeur}
                onChange={(e) => setServiceDemandeur(e.target.value)}
                className="form-control"
                required
              >
                <option value="">Sélectionnez un service</option>
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {loading ? '⏳ Création...' : '✅ Créer la demande'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                ❌ Annuler
              </button>
            </div>
          </form>
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
  }, [filter, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRequests = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      let query = supabase.from('requests').select(`
        *,
        profiles!requests_user_id_fkey(email, service),
        assigned_profile:profiles!requests_assigned_to_fkey(email, service)
      `).order('created_at', { ascending: false });

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
        alert('✅ Demande prise en charge avec succès !');
      } else {
        alert('❌ Impossible de prendre cette demande');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la prise en charge');
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
      alert('🎉 Demande clôturée avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la clôture');
    }
  };

  const getStatusIcon = (status) => {
    const iconProps = { className: 'status-icon' };
    switch (status) {
      case 'ouvert':
        return React.createElement(AlertCircle, { ...iconProps, color: '#ef4444' });
      case 'en_cours':
        return React.createElement(Clock, { ...iconProps, color: '#f59e0b' });
      case 'termine':
        return React.createElement(CheckCircle, { ...iconProps, color: '#10b981' });
      default:
        return React.createElement(AlertCircle, { ...iconProps, color: '#6b7280' });
    }
  };

  const getPriorityBadgeClass = (priority) => {
    return `badge badge-priority-${priority}`;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ouvert':
        return '🆕 Nouveau';
      case 'en_cours':
        return '⏳ En cours';
      case 'termine':
        return '✅ Terminé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="animate-pulse">⏳ Chargement des demandes...</div>
      </div>
    );
  }

  return (
    <div>
      {isITOrAdmin && (
        <div className="filter-tabs">
          <button
            onClick={() => setFilter('all')}
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          >
            📋 Toutes les demandes
          </button>
          <button
            onClick={() => setFilter('unassigned')}
            className={`filter-tab ${filter === 'unassigned' ? 'active' : ''}`}
          >
            🆕 Non assignées
          </button>
          <button
            onClick={() => setFilter('assigned')}
            className={`filter-tab ${filter === 'assigned' ? 'active' : ''}`}
          >
            👤 Mes demandes
          </button>
        </div>
      )}

      {requests.length === 0 ? (
        <div className="empty-state">
          <h3>🕳️ Aucune demande trouvée</h3>
          <p>Il n'y a actuellement aucune demande correspondant à vos critères.</p>
        </div>
      ) : (
        <div>
          {requests.map((request) => (
            <div key={request.id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="card-header">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="card-title">{request.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                          <span className={getPriorityBadgeClass(request.priority)}>
                            {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                          </span>
                          <div className="type-indicator">
                            {request.type === 'incident' ? 
                              React.createElement(AlertTriangle, { size: 14 }) : 
                              React.createElement(ShoppingCart, { size: 14 })
                            }
                            {request.type === 'incident' ? 'Incident' : 'Commande'}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {getStatusText(request.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card-content">
                      {request.description}
                    </div>
                    
                    <div className="card-footer">
                      <div>📍 <strong>Localisation:</strong> {request.location}</div>
                      <div>🏢 <strong>Service:</strong> {request.service_demandeur}</div>
                      <div>👤 <strong>Demandeur:</strong> {request.profiles?.email}</div>
                      {request.assigned_profile && (
                        <div>⚡ <strong>Assigné à:</strong> {request.assigned_profile.email}</div>
                      )}
                      <div>📅 <strong>Créé le:</strong> {new Date(request.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </div>
                  </div>
                  
                  {isITOrAdmin && (
                    <div className="card-actions">
                      {request.status === 'ouvert' && !request.assigned_to && (
                        <button
                          onClick={() => takeRequest(request.id)}
                          className="btn btn-primary"
                        >
                          🚀 Prendre en charge
                        </button>
                      )}
                      {request.status === 'en_cours' && (request.assigned_to === profile.id || profile.role === 'admin') && (
                        <button
                          onClick={() => closeRequest(request.id)}
                          className="btn btn-success"
                        >
                          ✅ Clôturer
                        </button>
                      )}
                    </div>
                  )}
                </div>
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
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="nav-title">🎫 Centre Diagnostic - Support IT</h1>
          <div className="nav-actions">
            <div className="user-info">
              <span>👤 {profile?.email}</span>
              <span>🏢 {profile?.service}</span>
              {(profile?.role === 'it_member' || profile?.role === 'admin') && 
                <span className="user-badge">
                  {profile?.role === 'admin' ? '👑 Admin' : '🔧 IT'}
                </span>
              }
            </div>
            <button
              onClick={() => setShowCreateRequest(true)}
              className="btn btn-primary"
            >
              <Plus size={18} />
              Nouvelle demande
            </button>
            <button
              onClick={signOut}
              className="btn btn-ghost"
            >
              <LogOut size={18} />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
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
      <div className="loading-state" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>⏳ Chargement de l'application...</div>
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