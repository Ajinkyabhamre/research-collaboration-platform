import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Search, FileText, MessageCircle, CheckCircle, Users, Rocket, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerChildren } from '../lib/motion';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div variants={fadeUp} className="text-center">
    <div className="w-16 h-16 gradient-maroon rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-gray-900">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const CheckItem = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckCircle className="w-5 h-5 text-stevensMaroon flex-shrink-0 mt-0.5" />
    <span className="text-gray-700">{children}</span>
  </li>
);

export const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative gradient-maroon text-white overflow-hidden">
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent)]" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Find research.
              <br />
              Build teams.
              <br />
              <span className="text-stevensMaroon-200">Publish faster.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto leading-relaxed">
              The premier platform for research collaboration at Stevens Institute of Technology.
              Connect with faculty, join innovative projects, and advance your academic career.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/sign-up">
                <Button size="lg" variant="secondary" className="min-w-[200px]">
                  Join as Student
                </Button>
              </Link>
              <Link to="/sign-in">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-stevensMaroon min-w-[200px]"
                >
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { value: '50+', label: 'Active Projects' },
                { value: '200+', label: 'Researchers' },
                { value: '15', label: 'Departments' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm md:text-base text-white/80">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Everything you need for research collaboration
          </motion.h2>
          <motion.p variants={fadeUp} className="text-center text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
            Streamline your research workflow with our comprehensive suite of tools designed for academic excellence.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-10 md:gap-12">
            <FeatureCard
              icon={Search}
              title="Discover Projects"
              description="Browse cutting-edge research projects across all departments at Stevens. Find opportunities that match your interests and expertise."
            />
            <FeatureCard
              icon={FileText}
              title="Apply Easily"
              description="Submit applications and track your progress all in one place. Streamlined process from application to approval."
            />
            <FeatureCard
              icon={MessageCircle}
              title="Collaborate"
              description="Real-time messaging and project updates keep your team connected. Share progress and coordinate seamlessly."
            />
          </div>
        </motion.div>
      </div>

      {/* Detailed Features */}
      <div className="bg-gradient-to-b from-muted/30 to-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="linkedin-card p-8 hover:shadow-card-hover transition-shadow duration-200">
              <div className="w-12 h-12 bg-stevensMaroon-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-stevensMaroon" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Stay Updated
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Get real-time updates on project developments, new opportunities, and research announcements
                through our integrated newsfeed.
              </p>
              <ul className="space-y-3">
                <CheckItem>Project milestones and achievements</CheckItem>
                <CheckItem>New research opportunities</CheckItem>
                <CheckItem>Community achievements and publications</CheckItem>
              </ul>
            </div>

            <div className="linkedin-card p-8 hover:shadow-card-hover transition-shadow duration-200">
              <div className="w-12 h-12 bg-stevensMaroon-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-stevensMaroon" />
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                Build Your Team
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage your research team effectively with built-in collaboration tools and communication features.
              </p>
              <ul className="space-y-3">
                <CheckItem>Real-time project messaging</CheckItem>
                <CheckItem>Team member management and roles</CheckItem>
                <CheckItem>Streamlined application review</CheckItem>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="linkedin-card p-12 text-center bg-gradient-to-br from-muted/50 to-white">
          <Rocket className="w-16 h-16 text-stevensMaroon mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
            Trusted at Stevens
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Designed specifically for the Stevens research community to facilitate collaboration,
            innovation, and academic excellence across all departments.
          </p>
          <Link to="/sign-up">
            <Button size="lg" className="px-8">
              Join Stevens Research Today
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-maroon rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">SR</span>
              </div>
              <div>
                <div className="font-bold text-lg">Stevens Research</div>
                <div className="text-sm text-gray-400">Built for Stevens Institute of Technology</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2024 Stevens Research. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
