import { Metadata } from 'next'
import { ShieldCheck, Search, Star, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'เกี่ยวกับเรา - แอฟฟิลิเอทพรีเมียม',
  description: 'เรียนรู้เกี่ยวกับภารกิจของเราในการช่วยคุณค้นพบสินค้าที่ดีที่สุดผ่านรีวิวและคำแนะนำที่จริงใจ',
}

export default function AboutPage() {
  return (
    <div className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
            ช่วยให้คุณช้อปอย่างชาญฉลาด
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            เราเชื่อว่าการค้นหาสินค้าที่ดีไม่ควรเป็นเรื่องยุ่งยาก
            ทีมงานของเราค้นคว้าและคัดสรรสินค้าที่ดีที่สุดเพื่อให้คุณช้อปได้อย่างมั่นใจ
          </p>
        </div>

        {/* Mission */}
        <div className="bg-slate-50 rounded-2xl p-8 md:p-12 mb-16">
          <h2 className="text-2xl font-bold mb-4 text-black">ภารกิจของเรา</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            ในโลกที่มีตัวเลือกมากมายและรีวิวที่อาจทำให้เข้าใจผิด เราตัดสิ่งที่ไม่จำเป็นออก
            เพื่อนำเสนอสินค้าที่ดีเยี่ยมอย่างแท้จริง ทุกสินค้าบนเว็บไซต์ของเราได้รับการ
            ประเมินอย่างละเอียดในด้านคุณภาพ ความคุ้มค่า และประสิทธิภาพการใช้งานจริง
          </p>
          <p className="text-slate-600 leading-relaxed">
            เราไม่ได้รับการสนับสนุนจากแบรนด์หรือรับเงินเพื่อโปรโมทสินค้าใดๆ
            คำแนะนำของเราอิงจากคุณภาพล้วนๆ เพื่อให้มั่นใจว่าคุณได้รับคำแนะนำที่จริงใจ
            สำหรับการตัดสินใจซื้อของคุณ
          </p>
        </div>

        {/* How We Review */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center text-black">วิธีการรีวิวสินค้าของเรา</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-black">การวิจัยเชิงลึก</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                เราวิเคราะห์สเปค อ่านรีวิวจากผู้ใช้หลายร้อยรีวิว และ
                เปรียบเทียบสินค้ากับคู่แข่งเพื่อทำความเข้าใจว่าอะไรทำให้
                แต่ละสินค้ามีความพิเศษ
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-black">มาตรฐานคุณภาพ</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                เฉพาะสินค้าที่ผ่านเกณฑ์คุณภาพที่เข้มงวดของเราเท่านั้นที่จะได้รับการแนะนำ
                เรามุ่งเน้นที่ความทนทาน ประสิทธิภาพ และความพึงพอใจของลูกค้า
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-black">แหล่งที่มาที่ตรวจสอบแล้ว</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                เราลิงก์ไปยังร้านค้าที่น่าเชื่อถือเท่านั้น ที่มีประวัติที่ดี
                ในด้านการบริการลูกค้า การคืนสินค้า และสินค้าของแท้
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-black">ความคิดเห็นจากชุมชน</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                เราอัปเดตคำแนะนำอย่างต่อเนื่องตามความคิดเห็นของผู้ใช้
                และสภาวะตลาดที่เปลี่ยนแปลงเพื่อให้ตัวเลือกของเราทันสมัยอยู่เสมอ
              </p>
            </div>
          </div>
        </div>

        {/* Transparency */}
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold mb-4 text-black">ความโปร่งใส</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            เราได้รับค่าคอมมิชชั่นเล็กน้อยเมื่อคุณซื้อผ่านลิงก์แอฟฟิลิเอทของเรา
            สิ่งนี้ไม่ทำให้คุณต้องจ่ายเพิ่มและช่วยให้เราดูแลและปรับปรุงบริการของเราได้
          </p>
          <p className="text-slate-600 leading-relaxed">
            กระบวนการบรรณาธิการของเราเป็นอิสระจากความร่วมมือด้านแอฟฟิลิเอท
            เราแนะนำสินค้าเพราะมันดีเยี่ยมจริงๆ ไม่ใช่เพราะจ่ายค่าคอมมิชชั่นสูงที่สุด
          </p>
        </div>
      </div>
    </div>
  )
}
