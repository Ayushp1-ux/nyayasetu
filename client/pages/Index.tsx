import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Scale,
  FileText,
  Phone,
  Mail,
  MapPin,
  Shield,
  Users,
  Clock,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (formData.phone && !/^\+?\d{7,15}$/.test(formData.phone))
      newErrors.phone = "Phone is invalid";

    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((res) => setTimeout(res, 1500)); // Simulated delay

    toast.success("Message sent successfully!");
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const testimonials = [
    {
      name: "Priya Singh",
      role: "Entrepreneur",
      image:
        "https://ui-avatars.com/api/?name=Priya+Singh&background=0D8ABC&color=fff&size=128",
      rating: 5,
      quote:
        "NyayaPath provided me quick legal advice and helped me navigate complex contracts effortlessly!",
    },
    {
      name: "Rahul Kumar",
      role: "Freelancer",
      image:
        "https://ui-avatars.com/api/?name=Rahul+Kumar&background=0D8ABC&color=fff&size=128",
      rating: 4,
      quote:
        "Very professional and responsive legal experts. Highly recommended for small business owners.",
    },
    {
      name: "Anjali Mehta",
      role: "Startup Founder",
      image:
        "https://ui-avatars.com/api/?name=Anjali+Mehta&background=0D8ABC&color=fff&size=128",
      rating: 5,
      quote:
        "I saved so much time and worry using NyayaPath’s AI assistant and legal experts. Excellent support!",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 px-4 bg-white dark:bg-gray-900"
      >
        <div className="container mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
          >
            Get Instant Legal Help
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
            className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Connect with experienced legal professionals and get the help you need. Whether you have questions or need document assistance,
            we're here to guide you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link to="/ask-question">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="bg-primary-500 hover:bg-primary-700 text-white px-8 py-6 rounded-lg font-semibold shadow-lg text-lg flex items-center gap-2 min-w-[220px]"
              >
                <FileText className="h-5 w-5" />
                Ask a Legal Question
              </motion.button>
            </Link>

            <Link to="/ai-assistant">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="border-2 border-primary-500 text-primary-600 bg-white hover:bg-primary-600 hover:text-white px-8 py-6 rounded-lg font-semibold shadow-lg text-lg flex items-center gap-2 min-w-[220px]"
              >
                <Scale className="h-5 w-5" />
                Ask AI Legal Assistant
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="services" className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Why Choose NyayaPath?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-primary mx-auto mb-4" />,
                title: "Trusted Experts",
                description: "Verified legal professionals with years of experience in various fields of law.",
              },
              {
                icon: <Clock className="h-12 w-12 text-primary mx-auto mb-4" />,
                title: "Quick Response",
                description: "Get answers to your legal questions within hours, not days. Time-sensitive matters handled with priority.",
              },
              {
                icon: <Users className="h-12 w-12 text-primary mx-auto mb-4" />,
                title: "Personalized Support",
                description: "Every case is unique. Our experts provide tailored advice based on your specific situation.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
                className="text-center bg-white dark:bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                {feature.icon}
                <h3 className="text-xl font-semibold dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.2, ease: "easeOut" }}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
              >
                <img
                  src={t.image}
                  alt={t.name}
                  loading="lazy"
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="font-semibold text-lg text-primary dark:text-primary">{t.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t.role}</p>
                <div className="mb-4">
                  {[...Array(t.rating)].map((_, idx) => (
                    <span key={idx} className="text-yellow-400">&#9733;</span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-200 italic">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-16 px-4 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-gray-800 dark:to-gray-900"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Get In Touch</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="space-y-6 text-gray-800 dark:text-gray-300">
              <div className="flex items-center space-x-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold dark:text-white">Phone</h3>
                  <p>+91 1800-123-4567</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold dark:text-white">Email</h3>
                  <p>help@nyayapath.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold dark:text-white">Office</h3>
                  <p>123 Legal District, New Delhi, India</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800 dark:text-gray-300">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="dark:text-gray-300">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? "border-red-500" : ""}
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="phone" className="dark:text-gray-300">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? "border-red-500" : ""}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? "border-red-500" : ""}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Label htmlFor="message" className="dark:text-gray-300">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={errors.message ? "border-red-500" : ""}
                  required
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-800 text-white py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Scale className="h-6 w-6" />
            <span className="text-xl font-bold">NyayaPath</span>
          </div>
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a
              href="https://facebook.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-primary"
            >
              <Facebook className="h-6 w-6" />
            </a>
            <a
              href="https://twitter.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="hover:text-primary"
            >
              <Twitter className="h-6 w-6" />
            </a>
            <a
              href="https://linkedin.com/in/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-primary"
            >
              <Linkedin className="h-6 w-6" />
            </a>
            <a
              href="https://instagram.com/yourprofile"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-primary"
            >
              <Instagram className="h-6 w-6" />
            </a>
          </div>
          <p className="text-gray-400 md:ml-auto">© 2024 NyayaPath. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
