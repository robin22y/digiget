import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is Basic really free forever?",
    answer: "Yes. If you stay on Basic (you + 1 staff, 50 customers/month), it's free forever. No credit card needed. Ever."
  },
  {
    question: "What happens at 51 customers?",
    answer: "We'll prompt you to upgrade to Pro. You can either upgrade or wait until next month when it resets to 50 again."
  },
  {
    question: "Is Pro really free until Christmas?",
    answer: "Yes. We're testing the product. Pro is completely free until Christmas 2025. After that, it's £9.99/month or switch to Basic."
  },
  {
    question: "Do I need to buy a tablet?",
    answer: "No. Works on any phone, tablet, or computer you already have. Just open a web browser."
  },
  {
    question: "Do customers need to download an app?",
    answer: "No. They just give their phone number at the till. That's it."
  },
  {
    question: "Can staff clock in from home?",
    answer: "No. We use GPS to check they're at your shop. If they're not there, they can't clock in."
  },
  {
    question: "What if I want to cancel?",
    answer: "Cancel anytime from your dashboard. No questions asked. You can export all your data before you go."
  },
  {
    question: "How does the loyalty reward work?",
    answer: "You decide: 'Buy 10 coffees, get 1 free' or '100 points = £5 off'. Customers see their points when they check in."
  },
  {
    question: "Can I try Pro then downgrade to Basic?",
    answer: "Yes. Switch between plans anytime. Downgrade and it's free again."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Bank-level encryption. UK-based servers. GDPR compliant."
  }
];

function FAQItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-ios overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900 pr-8">
          {item.question}
        </span>
        <span className="text-2xl text-gray-400 flex-shrink-0">
          {isOpen ? "▼" : "▷"}
        </span>
      </button>
      
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Quick Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((item, index) => (
            <FAQItem
              key={index}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

