import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  MoreVertical,
  Paperclip,
  Send,
  Package,
  Phone,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Truck,
  Sparkles
} from 'lucide-react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import { supportService } from '../../services/supportService';
import { StorefrontAPI } from '../../services/api';
import { haptics } from '../../services/haptics';

export default function SupportChatScreen() {
  const params = useLocalSearchParams();
  const orderId = params.orderId;
  const initialTopic = params.topic;

  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: 'Hi! 👋 Tell me how I can help with your order today?',
      timestamp: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      StorefrontAPI.getOrderDetails(orderId)
        .then((res) => {
          if (res.data?.data) {
            setOrder(res.data.data);
          }
        })
        .catch(() => {});
    }

    if (initialTopic) {
      setTimeout(() => {
        handleUserSend(initialTopic);
      }, 400);
    }
  }, [orderId]);

  const handleUserSend = async (customText) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isTyping) return;

    haptics.impactLight();
    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await supportService.sendSupportMessage(orderId, textToSend, messages);
      setIsTyping(false);

      const botMsg = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        card: response.card,
        quickReplies: response.quickReplies,
        timestamp: 'Just now'
      };

      setMessages((prev) => [...prev, botMsg]);
      haptics.notificationSuccess();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'assistant',
          text: 'I am having trouble reaching the support servers. You can also contact our team directly at support@kuiklo.com.',
          timestamp: 'Just now'
        }
      ]);
    }
  };

  const handleCardAction = async (card) => {
    haptics.selection();
    if (card.actionType === 'TRACK_ORDER') {
      if (order?._id) {
        router.push(`/orders/${order._id}`);
      } else {
        router.push('/(tabs)/orders');
      }
    } else if (card.actionType === 'CALL_PARTNER') {
      Linking.openURL('tel:9876543210').catch(() => {});
    } else if (card.actionType === 'REQUEST_REFUND') {
      setIsTyping(true);
      const res = await supportService.requestRefund(orderId, 'Customer refund via chat');
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'assistant',
          text: `✓ ${res.message} Ticket #${res.ticketId}`,
          timestamp: 'Just now'
        }
      ]);
    } else if (card.actionType === 'REPORT_MISSING' || card.actionType === 'REPORT_WRONG') {
      if (order?._id) {
        router.push({
          pathname: '/orders/issue',
          params: { id: order._id }
        });
      } else {
        router.push('/(tabs)/orders');
      }
    }
  };

  const quickPrompts = [
    'Where is my order?',
    'My order hasn\'t arrived yet.',
    'Missing an item',
    'Wrong item delivered',
    'I want a refund'
  ];

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.4} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Kuiklo Assistant</Text>
          <View style={styles.onlineBadgeRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online • Instant Help</Text>
          </View>
        </View>
        <Pressable
          onPress={() => setShowMenu(true)}
          style={styles.menuBtn}
          accessibilityRole="button"
          accessibilityLabel="Options"
        >
          <MoreVertical size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Assistant Banner with Robot Mascot */}
          <View style={styles.heroCard}>
            <View style={styles.heroAvatarCircle}>
              <Image
                source={require('../../../assets/images/assistant_avatar.jpg')}
                style={styles.heroAvatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.heroSpeechBubble}>
              <Text style={styles.heroGreetingTitle}>Hi! I'm Kuiklo Assistant</Text>
              <Text style={styles.heroGreetingText}>
                I can help you with your order, delivery, refund, product or any other query.
              </Text>
            </View>
          </View>

          {/* Active Order Context Card */}
          {Boolean(order) && (
            <View style={styles.orderContextCard}>
              <View style={styles.orderContextThumbWrap}>
                <Image
                  source={require('../../../assets/images/order_basket.jpg')}
                  style={styles.orderContextThumb}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.orderContextCol}>
                <Text style={styles.orderContextNumber}>Order #{order.orderNumber}</Text>
                <Text style={styles.orderContextMeta}>
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })} • {order.items?.length || 1} items
                </Text>
                <Text style={styles.orderContextAmount}>₹{order.amount?.toFixed(2)}</Text>
              </View>
              <View style={[styles.orderContextStatus, {
                backgroundColor: order.status === 'Delivered' ? '#DCFCE7' : '#E0F2FE'
              }]}>
                <Text style={[styles.orderContextStatusText, {
                  color: order.status === 'Delivered' ? '#15803D' : '#0284C7'
                }]}>
                  {order.status === 'Delivered' ? 'Delivered' : 'On the way'}
                </Text>
              </View>
            </View>
          )}

          {/* Messages Stream */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            if (isUser) {
              return (
                <View key={msg.id} style={styles.userMessageRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userMessageText}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View key={msg.id} style={styles.botMessageRow}>
                <View style={styles.botAvatarCircle}>
                  <Image
                    source={require('../../../assets/images/assistant_avatar.jpg')}
                    style={styles.botAvatarImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.botContentCol}>
                  <View style={styles.botBubble}>
                    <Text style={styles.botMessageText}>{msg.text}</Text>
                  </View>

                  {/* Contextual Action Card */}
                  {Boolean(msg.card) && (
                    <Pressable
                      style={styles.interactiveActionCard}
                      onPress={() => handleCardAction(msg.card)}
                    >
                      <View style={styles.actionCardIconWrap}>
                        <Package size={20} color={colors.black} />
                      </View>
                      <View style={styles.actionCardTextCol}>
                        <Text style={styles.actionCardTitle}>{msg.card.title}</Text>
                        <Text style={styles.actionCardSubtitle}>{msg.card.subtitle}</Text>
                      </View>
                      <ChevronRight size={18} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}

          {isTyping && (
            <View style={styles.botMessageRow}>
              <View style={styles.botAvatarCircle}>
                <Image
                  source={require('../../../assets/images/assistant_avatar.jpg')}
                  style={styles.botAvatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={colors.black} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestion Pills */}
        <View style={styles.quickPromptsContainer}>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickPromptsScroll}
          >
            {quickPrompts.map((promptText) => (
              <Pressable
                key={promptText}
                style={({ pressed }) => [
                  styles.quickPromptPill,
                  { backgroundColor: pressed ? colors.primaryLight : colors.white }
                ]}
                onPress={() => handleUserSend(promptText)}
              >
                <Text style={styles.quickPromptText}>{promptText}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Bottom Input Area */}
        <View style={styles.bottomInputBar}>
          <Pressable
            style={styles.clipBtn}
            onPress={() => {
              haptics.selection();
              handleUserSend('I need assistance with an invoice or order document');
            }}
          >
            <Paperclip size={20} color={colors.textSecondary} strokeWidth={2.2} />
          </Pressable>

          <TextInput
            style={styles.chatTextInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleUserSend()}
            returnKeyType="send"
          />

          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: pressed ? colors.primaryDark : colors.primary,
                opacity: inputText.trim().length > 0 ? 1 : 0.6
              }
            ]}
            onPress={() => handleUserSend()}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={colors.black} strokeWidth={2.6} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                Linking.openURL('tel:9876543210').catch(() => {});
              }}
            >
              <Phone size={18} color={colors.black} style={{ marginRight: 10 }} />
              <Text style={styles.menuItemText}>Call Customer Helpline</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setMessages([
                  {
                    id: 'msg_welcome',
                    sender: 'assistant',
                    text: 'Chat cleared! How else can I help with your Kuiklo orders?',
                    timestamp: 'Just now'
                  }
                ]);
              }}
            >
              <RotateCcw size={18} color={colors.black} style={{ marginRight: 10 }} />
              <Text style={styles.menuItemText}>Restart Conversation</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: spacing.xs
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
    marginRight: 4
  },
  onlineText: {
    fontSize: 11,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  keyboardContainer: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  heroAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF9E8',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: spacing.xs
  },
  heroAvatarImage: {
    width: 80,
    height: 80
  },
  heroSpeechBubble: {
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    maxWidth: 320
  },
  heroGreetingTitle: {
    fontSize: 15,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  heroGreetingText: {
    fontSize: 13,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18
  },
  orderContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    marginBottom: spacing.md
  },
  orderContextThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 10
  },
  orderContextThumb: {
    width: '100%',
    height: '100%'
  },
  orderContextCol: {
    flex: 1
  },
  orderContextNumber: {
    fontSize: 14,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  orderContextMeta: {
    fontSize: 12,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  orderContextAmount: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary,
    marginTop: 2
  },
  orderContextStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10
  },
  orderContextStatusText: {
    fontSize: 11,
    fontFamily: typography.family.bold
  },
  botMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md
  },
  botAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginRight: 8,
    marginTop: 2
  },
  botAvatarImg: {
    width: 32,
    height: 32
  },
  botContentCol: {
    flex: 1,
    alignItems: 'flex-start'
  },
  botBubble: {
    backgroundColor: colors.softBackground,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    maxWidth: '85%'
  },
  botMessageText: {
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    lineHeight: 20
  },
  userMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '82%'
  },
  userMessageText: {
    fontSize: 14,
    fontFamily: typography.family.semibold,
    color: colors.black,
    lineHeight: 20
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softBackground,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  typingText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textSecondary
  },
  interactiveActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 10,
    marginTop: 8,
    width: '92%'
  },
  actionCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  actionCardTextCol: {
    flex: 1
  },
  actionCardTitle: {
    fontSize: 13,
    fontFamily: typography.family.bold,
    color: colors.textPrimary
  },
  actionCardSubtitle: {
    fontSize: 11,
    fontFamily: typography.family.regular,
    color: colors.textSecondary,
    marginTop: 1
  },
  quickPromptsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.white,
    paddingVertical: 8
  },
  quickPromptsScroll: {
    paddingHorizontal: spacing.md,
    gap: 8
  },
  quickPromptPill: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  quickPromptText: {
    fontSize: 12,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  bottomInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8
  },
  clipBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.softBackground,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  chatTextInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.softBackground,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: typography.family.regular,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 16
  },
  menuCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: 220,
    overflow: 'hidden'
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  menuItemText: {
    fontSize: 13,
    fontFamily: typography.family.medium,
    color: colors.textPrimary
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.borderLight
  }
});
