import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Why is it so cheap?",
    answer: "We only include features independent shops actually need. We don't add expensive features built for large chains that you'd never use."
  },
  {
    question: "Do I need to buy any hardware?",
    answer: "No. Works on any phone, tablet, or computer with a web browser."
  },
  {
    question: "Is there really a 90-day free trial?",
    answer: "Yes. Full access to everything. No card required to start. Only pay if you decide to keep it after 90 days."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes. Cancel from your dashboard anytime. No contracts. No penalties."
  },
  {
    question: "What if I only have 1-2 staff?",
    answer: "Perfect. £9.99/month covers unlimited staff. Whether you have 1 or 10."
  },
  {
    question: "Do my customers need to download an app?",
    answer: "No. They just give their phone number at the till. That's it."
  },
  {
    question: "Does it work on iPhone/Android/iPad?",
    answer: "Yes. Works on any device with a web browser (Chrome, Safari, etc)."
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "You can export all your data (customer info, staff hours, etc) before cancelling. We keep it for 30 days after cancellation, then permanently delete it."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. Bank-level encryption. UK-based servers. GDPR compliant."
  },
  {
    question: "Can I upgrade from Basic to Pro later?",
    answer: "Yes. Upgrade or downgrade anytime from your dashboard."
  }
];

function FAQItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="w-full py-3 md:py-4 px-4 md:px-5 text-left flex justify-between items-center hover:text-blue-600 transition-colors duration-200"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-sm md:text-base font-semibold text-gray-900 pr-4 leading-relaxed">{item.question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 md:px-5 pb-3 md:pb-4 text-sm md:text-base text-gray-600 leading-relaxed">
          {item.answer}
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
    <section id="faq" className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 md:mb-12 text-center tracking-tight">
          Common Questions
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
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

